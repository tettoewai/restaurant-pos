"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface SocketContextType {
  channel: RealtimeChannel | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  channel: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ordersChannel = supabase.channel('orders');

    ordersChannel
      .on('system', { event: 'CHANNEL_JOIN' }, () => {
        setIsConnected(true);
      })
      .on('system', { event: 'CHANNEL_LEAVE' }, () => {
        setIsConnected(false);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    setChannel(ordersChannel);

    return () => {
      ordersChannel.unsubscribe();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ channel, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};