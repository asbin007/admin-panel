"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io from 'socket.io-client';
import { useAppDispatch } from '@/store/hooks';
import { fetchOrders } from '@/store/orderSlice';
import { fetchProducts } from '@/store/productSlice';
import { fetchUsers } from '@/store/authSlice';
import { fetchAllReviews } from '@/store/reviewsSlice';
import { fetchAllChats } from '@/store/chatSlice';

interface WebSocketContextType {
  socket: ReturnType<typeof io> | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: Date | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize WebSocket connection
    const initializeSocket = () => {
      try {
        setConnectionStatus('connecting');
        
        // Connect to WebSocket server
        const newSocket = io('wss://nike-backend-1-g9i6.onrender.com', {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
        });

        // Connection event handlers
        newSocket.on('connect', () => {
          console.log('🔌 WebSocket connected');
          setIsConnected(true);
          setConnectionStatus('connected');
          setLastUpdate(new Date());
        });

        newSocket.on('disconnect', (reason: string) => {
          console.log('🔌 WebSocket disconnected:', reason);
          setIsConnected(false);
          setConnectionStatus('disconnected');
        });

        newSocket.on('connect_error', (error: unknown) => {
          console.error('❌ WebSocket connection error:', error);
          setConnectionStatus('error');
          setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber: number) => {
          console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
          setIsConnected(true);
          setConnectionStatus('connected');
          setLastUpdate(new Date());
        });

        newSocket.on('reconnect_error', (error: unknown) => {
          console.error('❌ WebSocket reconnection error:', error);
          setConnectionStatus('error');
        });

        newSocket.on('reconnect_failed', () => {
          console.error('❌ WebSocket reconnection failed');
          setConnectionStatus('error');
        });

        // Real-time data update events
        newSocket.on('order_updated', (data: unknown) => {
          console.log('📦 Order updated:', data);
          dispatch(fetchOrders());
          setLastUpdate(new Date());
        });

        newSocket.on('order_created', (data: unknown) => {
          console.log('📦 New order created:', data);
          dispatch(fetchOrders());
          setLastUpdate(new Date());
        });

        newSocket.on('product_updated', (data: unknown) => {
          console.log('👟 Product updated:', data);
          dispatch(fetchProducts());
          setLastUpdate(new Date());
        });

        newSocket.on('product_created', (data: unknown) => {
          console.log('👟 New product created:', data);
          dispatch(fetchProducts());
          setLastUpdate(new Date());
        });

        newSocket.on('user_updated', (data: unknown) => {
          console.log('👤 User updated:', data);
          dispatch(fetchUsers());
          setLastUpdate(new Date());
        });

        newSocket.on('review_updated', (data: unknown) => {
          console.log('⭐ Review updated:', data);
          dispatch(fetchAllReviews());
          setLastUpdate(new Date());
        });

        newSocket.on('chat_updated', (data: unknown) => {
          console.log('💬 Chat updated:', data);
          dispatch(fetchAllChats());
          setLastUpdate(new Date());
        });

        // Dashboard refresh event
        newSocket.on('dashboard_refresh', (data: unknown) => {
          console.log('🔄 Dashboard refresh requested:', data);
          // Refresh all data
          Promise.all([
            dispatch(fetchOrders()),
            dispatch(fetchProducts()),
            dispatch(fetchUsers()),
            dispatch(fetchAllReviews()),
            dispatch(fetchAllChats())
          ]).then(() => {
            setLastUpdate(new Date());
          });
        });

        setSocket(newSocket);

        // Cleanup function
        return () => {
          newSocket.close();
          setSocket(null);
          setIsConnected(false);
          setConnectionStatus('disconnected');
        };
      } catch (error) {
        console.error('❌ Failed to initialize WebSocket:', error);
        setConnectionStatus('error');
        setIsConnected(false);
      }
    };

    // Initialize socket only on client side
    if (typeof window !== 'undefined') {
      initializeSocket();
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [dispatch]);

  // Manual refresh function
  const refreshData = () => {
    if (isConnected && socket) {
      socket.emit('request_dashboard_refresh');
    } else {
      // Fallback to direct API calls
      Promise.all([
        dispatch(fetchOrders()),
        dispatch(fetchProducts()),
        dispatch(fetchUsers()),
        dispatch(fetchAllReviews()),
        dispatch(fetchAllChats())
      ]).then(() => {
        setLastUpdate(new Date());
      });
    }
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    lastUpdate,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
