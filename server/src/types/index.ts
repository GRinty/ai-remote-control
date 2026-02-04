/**
 * 类型定义文件
 * 包含项目中使用的所有类型接口
 */

/** 消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system';

/** 聊天消息 */
export interface Message {
  role: MessageRole;
  content: string;
  timestamp?: number;
}

/** 工具定义 */
export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/** 工具调用 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

/** AI 响应 */
export interface AIResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** AI 流式响应块 */
export interface AIStreamChunk {
  content?: string;
  toolCall?: ToolCall;
  isComplete: boolean;
}

/** AI 提供者接口 */
export interface IAIProvider {
  name: string;
  chat(messages: Message[], tools?: Tool[]): Promise<AIResponse>;
  stream(messages: Message[], tools?: Tool[]): AsyncGenerator<AIStreamChunk>;
}

/** 任务状态 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/** 任务 */
export interface Task {
  id: string;
  type: string;
  params: Record<string, any>;
  status: TaskStatus;
  result?: any;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

/** 执行计划 */
export interface ExecutionPlan {
  steps: ExecutionStep[];
  reasoning?: string;
}

/** 执行步骤 */
export interface ExecutionStep {
  id: string;
  tool: string;
  params: Record<string, any>;
  description: string;
}

/** 工具执行结果 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  screenshot?: string;
}

/** 聊天会话 */
export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

/** Socket 事件 */
export enum SocketEvents {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  MESSAGE = 'message',
  STREAM_START = 'stream:start',
  STREAM_CHUNK = 'stream:chunk',
  STREAM_END = 'stream:end',
  TASK_START = 'task:start',
  TASK_UPDATE = 'task:update',
  TASK_COMPLETE = 'task:complete',
  TOOL_CALL = 'tool:call',
  TOOL_RESULT = 'tool:result',
  ERROR = 'error'
}

/** 配置 */
export interface Config {
  server: {
    port: number;
    host: string;
  };
  ai: {
    provider: string;
    model: string;
    apiKey: string;
    baseURL?: string;
    temperature: number;
    maxTokens: number;
  };
  security: {
    requireConfirmation: boolean;
    dangerousCommands: string[];
    maxConcurrentTasks: number;
  };
}
