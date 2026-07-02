import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth';
import { ClientCache } from './cache';
import { API_URL } from './apiClient';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if user is authenticated (or you could allow public connections, but we need JWT for user scopes)
    if (!session?.access_token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize Socket.io connection pointing to backend URL.
    // In local dev, this can connect through the Vite proxy using the current origin.
    const backendUrl = API_URL.replace(/\/api(\/v1)?\/?$/, '');
    const socketUrl = backendUrl || undefined;

    const newSocket = io(socketUrl, {
      auth: { token: session.access_token },
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to Realtime Gateway:', newSocket.id);
      setIsConnected(true);

      // Join the global community room and showroom room
      newSocket.emit('join', { room: 'community' });
      newSocket.emit('join', { room: 'showroom' });

      // Join user-specific room for notifications
      if (session.user?.id) {
        newSocket.emit('join', { room: `user_${session.user.id}` });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from Realtime Gateway');
      setIsConnected(false);
    });

    // ─── GLOBAL CACHE MUTATORS ──────────────────────────────────────

    // Listen for new community posts
    newSocket.on('new_post', (post) => {
      console.log('[Socket] Received new_post', post);
      ClientCache.mutate(`${API_URL}/community/posts`, (oldPosts: any[]) => {
        if (!oldPosts) return [post];
        // Prevent duplicates
        if (oldPosts.find((p) => p.id === post.id)) return oldPosts;
        return [post, ...oldPosts];
      });
    });

    // Listen for upvotes
    newSocket.on('post_upvoted', (payload: { postId: string; newCount: number }) => {
      console.log('[Socket] Received post_upvoted', payload);
      ClientCache.mutate(`${API_URL}/community/posts`, (oldPosts: any[]) => {
        if (!oldPosts) return oldPosts;
        return oldPosts.map((p) =>
          p.id === payload.postId ? { ...p, upvotes: payload.newCount } : p,
        );
      });
    });

    // Listen for notifications
    newSocket.on('new_notification', (notification) => {
      console.log('[Socket] Received new_notification', notification);
      ClientCache.mutate(`${API_URL}/community/notifications`, (oldNotifs: any[]) => {
        if (!oldNotifs) return [notification];
        return [notification, ...oldNotifs];
      });
    });

    // Listen for showroom updates
    newSocket.on('showroom_vehicle_upserted', (vehicle) => {
      console.log('[Socket] Received showroom_vehicle_upserted', vehicle);
      ClientCache.mutate(`${API_URL}/vehicles/showroom`, (oldVehicles: any[]) => {
        if (!oldVehicles) return [vehicle];
        const exists = oldVehicles.some((v) => v.id === vehicle.id);
        if (exists) {
          return oldVehicles.map((v) => (v.id === vehicle.id ? { ...v, ...vehicle } : v));
        }
        return [vehicle, ...oldVehicles];
      });
    });

    newSocket.on('showroom_vehicle_removed', ({ id }) => {
      console.log('[Socket] Received showroom_vehicle_removed', id);
      ClientCache.mutate(`${API_URL}/vehicles/showroom`, (oldVehicles: any[]) => {
        if (!oldVehicles) return [];
        return oldVehicles.filter((v) => v.id !== id);
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [session?.access_token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
  );
};
