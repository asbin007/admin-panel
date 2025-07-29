'use client';

import { Provider } from 'react-redux';
import store from '@/store/store';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import { useEffect } from 'react';

// Create socket instance outside React (global-like)
export const socket = io("http://localhost:5001", {
  autoConnect: false, // We'll manually connect in `AppProviders`
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Temporarily disable WebSocket to prevent connection errors
    // Set this to false when your WebSocket server is ready
    const ENABLE_WEBSOCKET = false;
    
    if (!ENABLE_WEBSOCKET) {
      console.log('AppProviders: WebSocket disabled temporarily');
      return;
    }
    
    const setupSocket = () => {
      // Get token from localStorage or cookies
      const token = typeof window !== 'undefined' ? localStorage.getItem("tokenHoYo") || document.cookie.split('; ').find(row => row.startsWith('tokenauth='))?.split('=')[1] : null;
      
      console.log('AppProviders: Token found:', token ? 'Yes' : 'No');
      
      if (token) {
        // Set auth token before connecting
        // @ts-expect-error - Socket.io auth property
        socket.auth = { token };
        console.log('AppProviders: Socket auth set with token');
      } else {
        console.warn('AppProviders: No authentication token found');
      }
      
      socket.connect();
    };

    // Add connection event listeners for debugging
    socket.on('connect', () => {
      console.log('AppProviders: WebSocket connected successfully');
    });
    
    socket.on('connect_error', (error: unknown) => {
      console.error('AppProviders: WebSocket connection error:', error);
      // Try to reconnect after a delay if there's an auth error
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message);
        if (errorMessage.includes('No user found') || errorMessage.includes('Please provide token')) {
          console.log('AppProviders: Auth error detected, will retry connection...');
          setTimeout(() => {
            if (!socket.connected) {
              setupSocket();
            }
          }, 2000);
        }
      }
    });
    
    socket.on('disconnect', (reason: unknown) => {
      console.log('AppProviders: WebSocket disconnected:', reason);
    });
    
    setupSocket();

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, []);

  // Listen for token changes (login/logout) - only if WebSocket is enabled
  useEffect(() => {
    const ENABLE_WEBSOCKET = false; // Keep in sync with above
    
    if (!ENABLE_WEBSOCKET) {
      return;
    }
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tokenHoYo') {
        console.log('AppProviders: Token changed, reconnecting socket...');
        if (socket.connected) {
          socket.disconnect();
        }
        // The main useEffect will handle reconnection
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Toaster position="top-right" />
        {children}
      </ThemeProvider>
    </Provider>
  );
}