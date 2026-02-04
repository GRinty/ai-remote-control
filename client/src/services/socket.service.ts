/**
 * Socket.io 服务
 * 管理与服务器的实时通信
 */

import { io, Socket } from 'socket.io-client';
import type { Message, ChatSession, ServerConfig, StreamChunk, StreamStart, StreamEnd, ErrorData } from '../types';

type EventCallback<T> = (data: T) => void;

/**
 * Socket 服务类
 */
class SocketService {
  private socket: Socket | null = null;
  private callbacks: Map<string, EventCallback<any>[]> = new Map();

  /**
   * 连接到服务器
   * @param url 服务器地址
   */
  connect(url: string = window.location.origin): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupEventListeners();
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 连接成功
    this.socket.on('connect', () => {
      console.log('已连接到服务器');
      this.emit('connectionChange', { status: 'connected' });
    });

    // 断开连接
    this.socket.on('disconnect', () => {
      console.log('与服务器断开连接');
      this.emit('connectionChange', { status: 'disconnected' });
    });

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('连接错误:', error);
      this.emit('connectionChange', { status: 'error', error });
    });

    // 流式响应开始
    this.socket.on('stream:start', (data: StreamStart) => {
      this.emit('streamStart', data);
    });

    // 流式响应数据块
    this.socket.on('stream:chunk', (data: StreamChunk) => {
      this.emit('streamChunk', data);
    });

    // 流式响应结束
    this.socket.on('stream:end', (data: StreamEnd) => {
      this.emit('streamEnd', data);
    });

    // 工具调用
    this.socket.on('tool:call', (data: { sessionId: string; toolCall: any }) => {
      this.emit('toolCall', data);
    });

    // 工具结果
    this.socket.on('tool:result', (data: { sessionId: string; result: any }) => {
      this.emit('toolResult', data);
    });

    // 错误
    this.socket.on('error', (data: ErrorData) => {
      this.emit('error', data);
    });

    // 会话创建
    this.socket.on('session_created', (session: ChatSession) => {
      this.emit('sessionCreated', session);
    });

    // 会话列表
    this.socket.on('sessions_list', (sessions: ChatSession[]) => {
      this.emit('sessionsList', sessions);
    });

    // 消息列表
    this.socket.on('messages_list', (data: { sessionId: string; messages: Message[] }) => {
      this.emit('messagesList', data);
    });
  }

  /**
   * 发送消息
   * @param sessionId 会话ID
   * @param content 消息内容
   */
  sendMessage(sessionId: string, content: string): void {
    this.socket?.emit('message', { sessionId, content });
  }

  /**
   * 创建新会话
   */
  createSession(): void {
    this.socket?.emit('create_session');
  }

  /**
   * 获取会话列表
   */
  getSessions(): void {
    this.socket?.emit('get_sessions');
  }

  /**
   * 获取会话消息
   * @param sessionId 会话ID
   */
  getMessages(sessionId: string): void {
    this.socket?.emit('get_messages', { sessionId });
  }

  /**
   * 清空会话
   * @param sessionId 会话ID
   */
  clearSession(sessionId: string): void {
    this.socket?.emit('clear_session', { sessionId });
  }

  /**
   * 删除会话
   * @param sessionId 会话ID
   */
  deleteSession(sessionId: string): void {
    this.socket?.emit('delete_session', { sessionId });
  }

  /**
   * 订阅事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);

    // 返回取消订阅函数
    return () => {
      const callbacks = this.callbacks.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param data 事件数据
   */
  private emit<T>(event: string, data: T): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件处理错误 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 获取连接状态
   */
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * 获取 Socket ID
   */
  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

// 导出单例实例
export const socketService = new SocketService();

// 导出 API 服务
export const apiService = {
  /**
   * 获取服务器配置
   */
  async getConfig(): Promise<ServerConfig> {
    const response = await fetch('/api/config');
    return response.json();
  },

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; provider: string; model: string }> {
    const response = await fetch('/api/health');
    return response.json();
  },

  /**
   * 获取可用工具列表
   */
  async getTools(): Promise<{ tools: any[] }> {
    const response = await fetch('/api/tools');
    return response.json();
  },

  /**
   * 创建会话
   */
  async createSession(): Promise<ChatSession> {
    const response = await fetch('/api/sessions', { method: 'POST' });
    return response.json();
  },

  /**
   * 获取所有会话
   */
  async getSessions(): Promise<{ sessions: ChatSession[] }> {
    const response = await fetch('/api/sessions');
    return response.json();
  },

  /**
   * 获取会话消息
   * @param sessionId 会话ID
   */
  async getMessages(sessionId: string): Promise<{ messages: Message[] }> {
    const response = await fetch(`/api/sessions/${sessionId}/messages`);
    return response.json();
  },

  /**
   * 删除会话
   * @param sessionId 会话ID
   */
  async deleteSession(sessionId: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
    return response.json();
  },

  /**
   * 发送消息（非流式）
   * @param sessionId 会话ID
   * @param content 消息内容
   */
  async sendMessage(sessionId: string, content: string): Promise<{ content: string; toolCalls?: any[]; toolResults?: any[] }> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, content })
    });
    return response.json();
  }
};
