'use client';

import { Provider } from 'react-redux';
import store from '@/store/store';
import { ThemeProvider } from '@/components/ui/theme-provider';
import io from 'socket.io-client';
import { useEffect, useState, Component } from 'react';

// Socket URL configuration
const SOCKET_URL = "https://nike-backend-1-g9i6.onrender.com";

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  hasChunkError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ChunkLoadErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, hasChunkError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Check if it's a chunk load error
    if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
      return { hasChunkError: true, hasError: false };
    }
    return { hasError: true, hasChunkError: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chunk Load Error:', error, errorInfo);
    
    // If it's a chunk load error, reload the page
    if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  render() {
    if (this.state.hasChunkError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Application...</h2>
            <p className="text-gray-600">Please wait while we load the latest version.</p>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create socket instance with better configuration
export const socket = io(SOCKET_URL, {
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

    // Check if WebSocket was previously disabled due to errors
    const webSocketDisabled = localStorage.getItem('websocket_disabled');
    if (webSocketDisabled === 'true') {
      console.log('WebSocket previously disabled due to errors - using API-only mode');
      setIsWebSocketEnabled(false);
      setConnectionStatus('disconnected');
      return;
    }
    
    let reconnectTimeout: NodeJS.Timeout;
    let connectionCheckTimeout: NodeJS.Timeout;
    //
    
    const testConnection = async () => {
      try {
        // Test if the server is reachable by making a simple HTTP request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${SOCKET_URL}/api/health`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        return response.ok || response.status === 401; // 401 means server is up but needs auth
      } catch (error) {
        console.log('Server health check failed:', error);
        return false;
      }
    };

    const setupSocket = async () => {
      try {
        const token = typeof window !== 'undefined' ? 
          localStorage.getItem("tokenauth") || 
          document.cookie.split('; ').find(row => row.startsWith('tokenauth='))?.split('=')[1] : 
          null;
        
        if (token && !socket.connected && isWebSocketEnabled) {
          // Test server availability first
          const serverAvailable = await testConnection();
          if (!serverAvailable) {
            console.warn('🌐 Server not available - disabling WebSocket');
            setIsWebSocketEnabled(false);
            setConnectionStatus('disconnected');
            return;
          }

          setConnectionStatus('connecting');
          console.log('🔐 Connecting with token:', token.substring(0, 20) + '...');
          
          // Connect with auth token
          socket.connect();
          
          // Add authentication event listener
          socket.on('authenticated', (data: { userId: string }) => {
            console.log('✅ Admin authenticated via WebSocket:', data);
            setConnectionStatus('connected');
            // Store the authenticated user ID for use in order updates
            (socket as unknown as { authenticatedUserId: string }).authenticatedUserId = data.userId;
            console.log('💾 Stored authenticated user ID:', data.userId);
          });
          
          socket.on('unauthorized', (error: unknown) => {
            console.error('❌ Admin WebSocket authentication failed:', error);
            setConnectionStatus('error');
            setIsWebSocketEnabled(false);
          });
          
          // Set a timeout to check if connection is successful
          connectionCheckTimeout = setTimeout(() => {
            if (!socket.connected) {
              setConnectionStatus('error');
              setIsWebSocketEnabled(false);
              console.warn('WebSocket connection timeout - server might not be running');
              console.warn('💡 Falling back to API-only mode');
            }
          }, 5000);
        } else if (!token) {
          console.log('No authentication token found - WebSocket disabled');
          setIsWebSocketEnabled(false);
          setConnectionStatus('disconnected');
        } else if (!isWebSocketEnabled) {
          console.log('WebSocket disabled due to previous errors - using API fallback');
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        setConnectionStatus('error');
        setIsWebSocketEnabled(false);
      }
    };

    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully to:', "https://nike-backend-1-g9i6.onrender.com");
      console.log('🔌 Socket ID:', socket.id);
      console.log('🔌 Transport:', (socket.io as { engine?: { transport?: { name?: string } } }).engine?.transport?.name || 'unknown');
      setConnectionStatus('connected');
      setIsWebSocketEnabled(true);
      
      // Clear any pending reconnect attempts
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (connectionCheckTimeout) {
        clearTimeout(connectionCheckTimeout);
      }
      
      // Emit a test event to verify connection
      const token = typeof window !== 'undefined' ? 
        localStorage.getItem("tokenauth") || 
        document.cookie.split('; ').find(row => row.startsWith('tokenauth='))?.split('=')[1] : 
        null;
      socket.emit('adminConnected', { 
        timestamp: Date.now(),
        adminId: token ? 'authenticated' : 'anonymous'
      });
    });
    
    socket.on('connect_error', (error: unknown) => {
      console.error('❌ WebSocket connection error:', error);
      setConnectionStatus('error');
      
      // Clear connection check timeout
      if (connectionCheckTimeout) {
        clearTimeout(connectionCheckTimeout);
      }
      
              if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = String((error as { message: string }).message);
        
        // Handle specific error types
        if (errorMessage.includes('xhr poll error') || errorMessage.includes('Network Error') || errorMessage.includes('websocket error') || errorMessage.includes('poll error')) {
          console.warn('🌐 Network error - WebSocket server might not be running');
          console.warn('💡 Make sure your backend server is running and has WebSocket support');
          console.warn('💡 Falling back to API-only mode');
          setIsWebSocketEnabled(false);
          setConnectionStatus('disconnected');
          // Disable WebSocket permanently for this session
          localStorage.setItem('websocket_disabled', 'true');
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
            }, 5000);
          }
        }
      }
      
      // Disable WebSocket after multiple failures
      setIsWebSocketEnabled(false);
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

    // Add a way to re-enable WebSocket (for debugging)
    if (typeof window !== 'undefined') {
      (window as unknown as { enableWebSocket: () => void }).enableWebSocket = () => {
        localStorage.removeItem('websocket_disabled');
        setIsWebSocketEnabled(true);
        setConnectionStatus('disconnected');
        setupSocket();
      };
    }

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
    <ChunkLoadErrorBoundary>
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
    </ChunkLoadErrorBoundary>
  );
}