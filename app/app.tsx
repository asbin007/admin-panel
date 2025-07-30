'use client';

import { Provider } from 'react-redux';
import store from '@/store/store';
import { ThemeProvider } from '@/components/ui/theme-provider';
import io from 'socket.io-client';
import { useEffect } from 'react';

// Create socket instance outside React (global-like)
export const socket = io("http://localhost:5001", {
  autoConnect: false, // We'll manually connect in `AppProviders`
});

// Make socket available globally
if (typeof window !== 'undefined') {
  (window as any).socket = socket;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const ENABLE_WEBSOCKET = true; // Enable WebSocket for chat functionality
    
    if (!ENABLE_WEBSOCKET) {
      return;
    }
    
    const setupSocket = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem("tokenauth") || document.cookie.split('; ').find(row => row.startsWith('tokenauth='))?.split('=')[1] : null;
      
      if (token) {
        // @ts-expect-error - Socket.io auth property
        socket.auth = { token };
      }
      
      socket.connect();
    };

    socket.on('connect', () => {
      console.log('websocket connected');
    });
    
    socket.on('connect_error', (error: unknown) => {
      console.error('websocket error:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message);
        if (errorMessage.includes('No user found') || errorMessage.includes('Please provide token')) {
          setTimeout(() => {
            if (!socket.connected) {
              setupSocket();
            }
          }, 2000);
        }
      }
    });
    
    socket.on('disconnect', () => {
      console.log('websocket disconnected');
    });
    
    setupSocket();

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const ENABLE_WEBSOCKET = true; // Enable WebSocket for chat functionality
    
    if (!ENABLE_WEBSOCKET) {
      return;
    }
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tokenHoYo') {
        if (socket.connected) {
          socket.disconnect();
        }
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
        {children}
      </ThemeProvider>
    </Provider>
  );
}