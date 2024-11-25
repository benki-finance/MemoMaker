"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  ws: null,
  isConnected: false,
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Update WebSocket URL to connect to FastAPI backend
    const socket = new WebSocket(
      process.env.NODE_ENV === 'production'
        ? `wss://${window.location.host}/ws`  // Update production URL if needed
        : 'ws://localhost:8000/ws'  // FastAPI WebSocket endpoint
    );

    socket.onopen = () => {
      console.log('WebSocket connected to FastAPI backend');
      setIsConnected(true);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected from FastAPI backend');
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setWs(socket);

    // Cleanup on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // Optional: Add reconnection logic
  useEffect(() => {
    if (!isConnected) {
      const reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect...');
        setWs(null); // This will trigger the first useEffect to run again
      }, 5000); // Try to reconnect every 5 seconds

      return () => clearTimeout(reconnectTimer);
    }
  }, [isConnected]);

  return (
    <WebSocketContext.Provider value={{ ws, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);