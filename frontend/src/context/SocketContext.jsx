import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 Socket disconnected');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const joinTrip = (tripId) => socketRef.current?.emit('join:trip', tripId);
  const leaveTrip = (tripId) => socketRef.current?.emit('leave:trip', tripId);

  const on = (event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  };

  const off = (event, handler) => socketRef.current?.off(event, handler);

  return (
    <SocketContext.Provider value={{ connected, joinTrip, leaveTrip, on, off, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
