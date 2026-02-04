/**
 * 前端类型定义
 */

/** 消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system';

/** 聊天消息 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

/** 聊天会话 */
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

/** 工具调用 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

/** 工具执行结果 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/** 连接状态 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/** 服务器配置 */
export interface ServerConfig {
  provider: string;
  model: string;
  server: {
    port: number;
    host: string;
  };
}

/** Socket 事件数据 */
export interface StreamChunk {
  sessionId: string;
  content?: string;
  toolCall?: ToolCall;
  isComplete: boolean;
}

export interface StreamStart {
  sessionId: string;
}

export interface StreamEnd {
  sessionId: string;
  messages: Message[];
}

export interface ErrorData {
  sessionId: string;
  error: string;
}
