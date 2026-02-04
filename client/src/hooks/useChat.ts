/**
 * 聊天功能 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { socketService, apiService } from '../services/socket.service';
import type { Message, ChatSession, ToolCall, ToolResult } from '../types';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 聊天 Hook
 */
export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentToolCall, setCurrentToolCall] = useState<ToolCall | null>(null);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);

  // 获取当前会话
  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  // 订阅 Socket 事件
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // 流式响应开始
    unsubscribers.push(
      socketService.on('streamStart', () => {
        setIsStreaming(true);
        setStreamingContent('');
      })
    );

    // 流式响应数据块
    unsubscribers.push(
      socketService.on('streamChunk', (data: { content?: string; toolCall?: ToolCall }) => {
        if (data.content) {
          setStreamingContent(prev => prev + data.content);
        }
        if (data.toolCall) {
          setCurrentToolCall(data.toolCall);
        }
      })
    );

    // 流式响应结束
    unsubscribers.push(
      socketService.on('streamEnd', (data: { sessionId: string; messages: Message[] }) => {
        setIsStreaming(false);
        setStreamingContent('');
        setCurrentToolCall(null);
        // 更新消息列表
        if (data.messages) {
          setMessages(data.messages.map((m: any) => ({
            ...m,
            id: m.id || generateId()
          })));
        }
      })
    );

    // 工具调用
    unsubscribers.push(
      socketService.on('toolCall', (data: { toolCall: ToolCall }) => {
        setCurrentToolCall(data.toolCall);
      })
    );

    // 工具结果
    unsubscribers.push(
      socketService.on('toolResult', (data: { result: ToolResult }) => {
        setToolResult(data.result);
        setTimeout(() => setToolResult(null), 3000);
      })
    );

    // 会话创建
    unsubscribers.push(
      socketService.on('sessionCreated', (session: ChatSession) => {
        setSessions(prev => [session, ...prev]);
        setCurrentSessionId(session.id);
        setMessages([]);
      })
    );

    // 会话列表
    unsubscribers.push(
      socketService.on('sessionsList', (data: ChatSession[]) => {
        setSessions(data);
      })
    );

    // 消息列表
    unsubscribers.push(
      socketService.on('messagesList', (data: { messages: Message[] }) => {
        setMessages(data.messages.map((m: any) => ({
          ...m,
          id: generateId()
        })));
      })
    );

    // 错误
    unsubscribers.push(
      socketService.on('error', (data: { error: string }) => {
        console.error('Socket 错误:', data.error);
        setIsStreaming(false);
      })
    );

    // 加载会话列表
    loadSessions();

    // 清理函数
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  /**
   * 加载会话列表
   */
  const loadSessions = useCallback(async () => {
    try {
      const { sessions } = await apiService.getSessions();
      setSessions(sessions);
    } catch (error) {
      console.error('加载会话列表失败:', error);
    }
  }, []);

  /**
   * 创建新会话
   */
  const createSession = useCallback(async () => {
    try {
      const session = await apiService.createSession();
      setSessions(prev => [session, ...prev]);
      setCurrentSessionId(session.id);
      setMessages([]);
      return session;
    } catch (error) {
      console.error('创建会话失败:', error);
      return null;
    }
  }, []);

  /**
   * 选择会话
   */
  const selectSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    try {
      const { messages } = await apiService.getMessages(sessionId);
      setMessages(messages.map((m: any) => ({
        ...m,
        id: generateId()
      })));
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  }, []);

  /**
   * 删除会话
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await apiService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  }, [currentSessionId]);

  /**
   * 发送消息
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    // 如果没有当前会话，创建一个新会话
    let sessionId = currentSessionId;
    if (!sessionId) {
      const session = await createSession();
      if (!session) return;
      sessionId = session.id;
    }

    // 添加用户消息
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);

    // 发送消息到服务器
    socketService.sendMessage(sessionId, content.trim());
  }, [currentSessionId, isStreaming, createSession]);

  /**
   * 清空当前会话
   */
  const clearCurrentSession = useCallback(() => {
    if (currentSessionId) {
      socketService.clearSession(currentSessionId);
      setMessages([]);
    }
  }, [currentSessionId]);

  return {
    sessions,
    currentSession,
    currentSessionId,
    messages,
    isStreaming,
    streamingContent,
    currentToolCall,
    toolResult,
    createSession,
    selectSession,
    deleteSession,
    sendMessage,
    clearCurrentSession,
    loadSessions
  };
}
