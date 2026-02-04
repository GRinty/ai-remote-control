/**
 * DeepSeek AI 提供者实现
 * 支持 DeepSeek Chat 和 DeepSeek Reasoner 模型
 */

import OpenAI from 'openai';
import { BaseAIProvider } from './base.provider';
import { Message, Tool, AIResponse, AIStreamChunk } from '../types';

/**
 * DeepSeek 提供者类
 * 使用 OpenAI SDK 调用 DeepSeek API
 */
export class DeepSeekProvider extends BaseAIProvider {
  readonly name = 'DeepSeek';
  private client: OpenAI;

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
      model: config.model || 'deepseek-chat',
      baseURL: config.baseURL || 'https://api.deepseek.com/v1',
      temperature: config.temperature,
      maxTokens: config.maxTokens
    });

    this.client = new OpenAI({
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
      const response = await this.client.chat.completions.create({
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
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: this.formatMessages(messages),
      tools: this.formatTools(tools),
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      stream: true
    });

    let currentToolCall: any = null;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      
      if (!delta) continue;

      // 处理内容
      if (delta.content) {
        yield {
          content: delta.content,
          isComplete: false
        };
      }

      // 处理工具调用
      if (delta.tool_calls) {
        for (const toolDelta of delta.tool_calls) {
          if (toolDelta.id) {
            currentToolCall = {
              id: toolDelta.id,
              name: toolDelta.function?.name || '',
              arguments: toolDelta.function?.arguments || ''
            };
          } else if (toolDelta.function?.arguments) {
            if (currentToolCall) {
              currentToolCall.arguments += toolDelta.function.arguments;
            }
          }
        }
      }

      // 检查是否完成
      if (chunk.choices[0]?.finish_reason) {
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
   * @returns OpenAI 格式的消息
   */
  protected formatMessages(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * 格式化工具
   * @param tools 标准工具格式
   * @returns OpenAI 格式的工具
   */
  protected formatTools(tools?: Tool[]): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;

    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  /**
   * 解析响应
   * @param response OpenAI 响应
   * @returns 标准 AI 响应格式
   */
  protected parseResponse(response: any): AIResponse {
    const choice = response.choices[0];
    const message = choice.message;

    const result: AIResponse = {
      content: message.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }
    };

    // 解析工具调用
    if (message.tool_calls && message.tool_calls.length > 0) {
      result.toolCalls = message.tool_calls.map((call: any) => ({
        id: call.id,
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments || '{}')
      }));
    }

    return result;
  }
}
