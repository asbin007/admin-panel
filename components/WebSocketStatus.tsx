"use client";

import { useEffect, useState } from 'react';
import { socket } from '@/app/app';

export default function WebSocketStatus() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  useEffect(() => {
    const updateStatus = () => {
      if (socket.connected) {
        setStatus('connected');
      } else if (socket.connecting) {
        setStatus('connecting');
      } else {
        setStatus('disconnected');
      }
    };

    // Initial status
    updateStatus();

    // Listen for status changes
    const handleConnect = () => setStatus('connected');
    const handleDisconnect = () => setStatus('disconnected');
    const handleConnecting = () => setStatus('connecting');
    const handleError = () => setStatus('error');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);
    socket.on('reconnect_attempt', handleConnecting);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
      socket.off('reconnect_attempt', handleConnecting);
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const statusConfig = {
    disconnected: { color: 'bg-gray-500', text: '🔌 WS Disconnected', description: 'WebSocket server not running' },
    connecting: { color: 'bg-yellow-500', text: '🔄 WS Connecting...', description: 'Attempting to connect' },
    connected: { color: 'bg-green-500', text: '✅ WS Connected', description: 'WebSocket ready' },
    error: { color: 'bg-red-500', text: '❌ WS Error', description: 'Connection failed' }
  };

  const config = statusConfig[status];

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`${config.color} text-white px-3 py-1 rounded text-xs shadow-lg`}>
        <div className="font-medium">{config.text}</div>
        <div className="text-xs opacity-75">{config.description}</div>
      </div>
    </div>
  );
} 