/ src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize socket connection when user is authenticated
      // For demo purposes, we'll simulate a connection
      const mockSocket = {
        emit: (event, data) => {
          console.log('Socket emit:', event, data);
        },
        on: (event, callback) => {
          console.log('Socket listening to:', event);
        },
        disconnect: () => {
          setConnected(false);
        }
      };
      
      setSocket(mockSocket);
      setConnected(true);
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};