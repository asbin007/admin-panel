'use client';

import { Provider } from 'react-redux';
import store from '@/store/store';
import { ThemeProvider } from '@/components/ui/theme-provider';
import io from 'socket.io-client';
import { useEffect, useState } from 'react';

// Create socket instance with better configuration
export const socket = io("https://nike-backend-1-g9i6.onrender.com", {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  auth: {
    token: typeof window !== 'undefined' ? localStorage.getItem("tokenauth") : null
  }
});

// Make socket available globally
if (typeof window !== 'undefined') {
  (window as unknown as { socket: typeof socket }).socket = socket;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [isWebSocketEnabled, setIsWebSocketEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  useEffect(() => {
    const ENABLE_WEBSOCKET = true; // Enable WebSocket for real-time updates
    
    if (!ENABLE_WEBSOCKET) {
      setIsWebSocketEnabled(false);
      return;
    }
    
    let reconnectTimeout: NodeJS.Timeout;
    let connectionCheckTimeout: NodeJS.Timeout;
    
    const setupSocket = () => {
      try {
        const token = typeof window !== 'undefined' ? 
          localStorage.getItem("tokenauth") || 
          document.cookie.split('; ').find(row => row.startsWith('tokenauth='))?.split('=')[1] : 
          null;
        
        if (token && !socket.connected) {
          setConnectionStatus('connecting');
          console.log('🔐 Connecting with token:', token.substring(0, 20) + '...');
          
          // Connect with auth token
          socket.connect();
          
          // Set a timeout to check if connection is successful
          connectionCheckTimeout = setTimeout(() => {
            if (!socket.connected) {
              setConnectionStatus('error');
              console.warn('WebSocket connection timeout');
            }
          }, 5000);
        } else if (!token) {
          console.log('No authentication token found - WebSocket disabled');
          setIsWebSocketEnabled(false);
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        setConnectionStatus('error');
      }
    };

    
    socket.on('connect_error', (error: unknown) => {
      console.error('❌ WebSocket connection error:', error);
      setConnectionStatus('error');
      
      // Clear connection check timeout
      if (connectionCheckTimeout) {
        clearTimeout(connectionCheckTimeout);
      }
      
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message);
        
        // Handle specific error types
        if (errorMessage.includes('xhr poll error') || errorMessage.includes('Network Error')) {
          console.warn('🌐 Network error - WebSocket server might not be running on port 5001');
          console.warn('💡 Make sure your backend server is running and has WebSocket support');
          setConnectionStatus('error');
          return;
        }
        
        if (errorMessage.includes('Please provide token') || errorMessage.includes('Unauthorized')) {
          console.warn('🔐 Authentication error - Token might be invalid or expired');
          console.warn('💡 WebSocket disabled - using API fallback only');
          setIsWebSocketEnabled(false);
          setConnectionStatus('disconnected');
          return;
        }
        
        if (errorMessage.includes('No user found') || errorMessage.includes('Please provide token')) {
          // Only attempt reconnect if not already connected
          if (!socket.connected) {
            reconnectTimeout = setTimeout(() => {
              setupSocket();
            }, 3000);
          }
        }
      }
      

    });
    
    socket.on('disconnect', (reason: string) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setConnectionStatus('disconnected');
      
      // Only attempt reconnect for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        // Server or client initiated disconnect - don't reconnect
        return;
      }
      
      // For other reasons, attempt reconnect
      if (isWebSocketEnabled) {
        reconnectTimeout = setTimeout(() => {
          setupSocket();
        }, 2000);
      }
    });
    
    socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
      setConnectionStatus('connecting');
    });
    
    socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed after all attempts');
      setConnectionStatus('error');
      setIsWebSocketEnabled(false);
    });
    
    // Simple WebSocket event listeners
    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      setConnectionStatus('connected');
      setIsWebSocketEnabled(true);
      
      // Clear any pending reconnect attempts
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (connectionCheckTimeout) {
        clearTimeout(connectionCheckTimeout);
      }
    });

    // Initial setup
    setupSocket();

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('reconnect_attempt');
      socket.off('reconnect_failed');
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (connectionCheckTimeout) {
        clearTimeout(connectionCheckTimeout);
      }
      
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [isWebSocketEnabled]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tokenauth') {
        if (socket.connected) {
          socket.disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Show connection status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isWebSocketEnabled) {
      const statusText = {
        disconnected: '🔌 Disconnected',
        connecting: '🔄 Connecting...',
        connected: '✅ Connected',
        error: '❌ Error'
      };
      
      console.log(`WebSocket Status: ${statusText[connectionStatus]}`);
    }
  }, [connectionStatus, isWebSocketEnabled]);

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