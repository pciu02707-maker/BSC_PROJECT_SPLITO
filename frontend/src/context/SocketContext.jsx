import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    s.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket connected');
    });

    s.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 Socket disconnected');
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  const joinTrip = useCallback((tripId) => {
    socket?.emit('join:trip', tripId);
  }, [socket]);

  const leaveTrip = useCallback((tripId) => {
    socket?.emit('leave:trip', tripId);
  }, [socket]);

  const on = useCallback((event, handler) => {
    socket?.on(event, handler);
    return () => socket?.off(event, handler);
  }, [socket]);

  const off = useCallback((event, handler) => {
    socket?.off(event, handler);
  }, [socket]);

  return (
    <SocketContext.Provider value={{ connected, joinTrip, leaveTrip, on, off, socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
