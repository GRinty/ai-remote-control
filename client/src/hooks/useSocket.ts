/**
 * Socket 连接 Hook
 */

import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socket.service';
import type { ConnectionStatus } from '../types';

/**
 * Socket 连接 Hook
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [socketId, setSocketId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // 连接到服务器
    socketService.connect();

    // 订阅连接状态变化
    const unsubscribe = socketService.on('connectionChange', (data: { status: ConnectionStatus }) => {
      setStatus(data.status);
      setIsConnected(data.status === 'connected');
      if (data.status === 'connected') {
        setSocketId(socketService.socketId);
      }
    });

    // 清理函数
    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * 手动重新连接
   */
  const reconnect = useCallback(() => {
    socketService.disconnect();
    socketService.connect();
  }, []);

  /**
   * 断开连接
   */
  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  return {
    isConnected,
    status,
    socketId,
    reconnect,
    disconnect
  };
}
