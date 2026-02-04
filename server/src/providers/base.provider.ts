/**
 * AI 提供者基类
 * 定义所有 AI 提供者的通用接口和基础功能
 */

import { IAIProvider, Message, Tool, AIResponse, AIStreamChunk } from '../types';

/**
 * AI 提供者抽象基类
 * 所有具体的 AI 提供者都需要继承此类
 */
export abstract class BaseAIProvider implements IAIProvider {
  /** 提供者名称 */
  abstract readonly name: string;
  
  /** API 密钥 */
  protected apiKey: string;
  
  /** 基础 URL */
  protected baseURL: string;
  
  /** 模型名称 */
  protected model: string;
  
  /** 温度参数 */
  protected temperature: number;
  
  /** 最大 token 数 */
  protected maxTokens: number;

  /**
   * 构造函数
   * @param config 提供者配置
   */
  constructor(config: {
    apiKey: string;
    baseURL?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || '';
    this.model = config.model;
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 4096;
  }

  /**
   * 普通聊天请求
   * @param messages 消息列表
   * @param tools 可用工具列表
   * @returns AI 响应
   */
  abstract chat(messages: Message[], tools?: Tool[]): Promise<AIResponse>;

  /**
   * 流式聊天请求
   * @param messages 消息列表
   * @param tools 可用工具列表
   * @returns 流式响应生成器
   */
  abstract stream(messages: Message[], tools?: Tool[]): AsyncGenerator<AIStreamChunk>;

  /**
   * 格式化消息为提供者特定格式
   * @param messages 标准消息格式
   * @returns 提供者特定的消息格式
   */
  protected abstract formatMessages(messages: Message[]): any[];

  /**
   * 格式化工具为提供者特定格式
   * @param tools 标准工具格式
   * @returns 提供者特定的工具格式
   */
  protected abstract formatTools(tools?: Tool[]): any[] | undefined;

  /**
   * 解析提供者响应为标准格式
   * @param response 提供者响应
   * @returns 标准 AI 响应格式
   */
  protected abstract parseResponse(response: any): AIResponse;

  /**
   * 生成唯一 ID
   * @returns 唯一标识符
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 延迟函数
   * @param ms 延迟毫秒数
   * @returns Promise
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重试函数
   * @param fn 需要重试的函数
   * @param maxRetries 最大重试次数
   * @param delayMs 重试间隔
   * @returns 函数执行结果
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await this.delay(delayMs * (i + 1));
        }
      }
    }
    
    throw lastError;
  }
}
