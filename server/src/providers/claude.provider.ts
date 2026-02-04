/**
 * Claude AI 提供者实现
 * 支持 Claude 3 Opus、Sonnet、Haiku 等模型
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base.provider';
import { Message, Tool, AIResponse, AIStreamChunk } from '../types';

/**
 * Claude 提供者类
 */
export class ClaudeProvider extends BaseAIProvider {
  readonly name = 'Claude';
  private client: Anthropic;

  /**
   * 构造函数
   * @param config 配置对象
   */
  constructor(config: {
    apiKey: string;
    model?: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    super({
      apiKey: config.apiKey,
      model: config.model || 'claude-3-sonnet-20240229',
      baseURL: config.baseURL,
      temperature: config.temperature,
      maxTokens: config.maxTokens
    });

    this.client = new Anthropic({
      apiKey: this.apiKey,
      baseURL: this.baseURL
    });
  }

  /**
   * 普通聊天请求
   * @param messages 消息列表
   * @param tools 可用工具列表
   * @returns AI 响应
   */
  async chat(messages: Message[], tools?: Tool[]): Promise<AIResponse> {
    return this.retry(async () => {
      const response = await this.client.messages.create({
        model: this.model,
        messages: this.formatMessages(messages),
        tools: this.formatTools(tools),
        temperature: this.temperature,
        max_tokens: this.maxTokens
      });

      return this.parseResponse(response);
    });
  }

  /**
   * 流式聊天请求
   * @param messages 消息列表
   * @param tools 可用工具列表
   * @returns 流式响应生成器
   */
  async *stream(messages: Message[], tools?: Tool[]): AsyncGenerator<AIStreamChunk> {
    const stream = await this.client.messages.create({
      model: this.model,
      messages: this.formatMessages(messages),
      tools: this.formatTools(tools),
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      stream: true
    });

    let currentToolCall: any = null;

    for await (const chunk of stream) {
      // 处理内容块
      if (chunk.type === 'content_block_delta') {
        const delta = chunk.delta as any;
        if (delta.type === 'text_delta' || delta.type === 'text') {
          yield {
            content: delta.text || '',
            isComplete: false
          };
        }
      }

      // 处理工具使用
      if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
        currentToolCall = {
          id: chunk.content_block.id,
          name: chunk.content_block.name,
          arguments: ''
        };
      }

      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'input_json_delta') {
        if (currentToolCall) {
          currentToolCall.arguments += chunk.delta.partial_json;
        }
      }

      // 检查是否完成
      if (chunk.type === 'message_stop') {
        if (currentToolCall) {
          yield {
            toolCall: {
              id: currentToolCall.id,
              name: currentToolCall.name,
              arguments: JSON.parse(currentToolCall.arguments || '{}')
            },
            isComplete: true
          };
        } else {
          yield {
            isComplete: true
          };
        }
      }
    }
  }

  /**
   * 格式化消息
   * @param messages 标准消息格式
   * @returns Claude 格式的消息
   */
  protected formatMessages(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
  }

  /**
   * 格式化工具
   * @param tools 标准工具格式
   * @returns Claude 格式的工具
   */
  protected formatTools(tools?: Tool[]): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;

    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters
    }));
  }

  /**
   * 解析响应
   * @param response Claude 响应
   * @returns 标准 AI 响应格式
   */
  protected parseResponse(response: any): AIResponse {
    const result: AIResponse = {
      content: '',
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      }
    };

    // 解析内容块
    for (const block of response.content) {
      if (block.type === 'text') {
        result.content += block.text;
      } else if (block.type === 'tool_use') {
        if (!result.toolCalls) result.toolCalls = [];
        result.toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input
        });
      }
    }

    return result;
  }
}
