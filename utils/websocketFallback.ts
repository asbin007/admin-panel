// WebSocket fallback utilities
export const isWebSocketAvailable = () => {
  return typeof window !== 'undefined' && (window as any).socket && (window as any).socket.connected;
};

export const getWebSocketStatus = () => {
  if (typeof window === 'undefined') return 'unavailable';
  
  const socket = (window as any).socket;
  if (!socket) return 'unavailable';
  
  if (socket.connected) return 'connected';
  if (socket.connecting) return 'connecting';
  return 'disconnected';
};

export const logWebSocketError = (error: any, context: string = '') => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`WebSocket ${context} error:`, error);
    console.info('💡 Tip: Make sure your WebSocket server is running on port 5001');
  }
};

export const createWebSocketFallback = () => {
  return {
    emit: (event: string, data: any) => {
      console.warn(`WebSocket not available - cannot emit ${event}`);
      return false;
    },
    on: (event: string, callback: Function) => {
      console.warn(`WebSocket not available - cannot listen to ${event}`);
      return false;
    },
    off: (event: string) => {
      console.warn(`WebSocket not available - cannot remove listener for ${event}`);
      return false;
    }
  };
}; 