/**
 * Ollama 本地模型提供者实现
 * 支持运行在本地的各种开源模型
 */

import { BaseAIProvider } from './base.provider';
import { Message, Tool, AIResponse, AIStreamChunk } from '../types';

/**
 * Ollama 提供者类
 * 用于连接本地运行的 Ollama 服务
 */
export class OllamaProvider extends BaseAIProvider {
  readonly name = 'Ollama';
  private ollamaBaseURL: string;

  /**
   * 构造函数
   * @param config 配置对象
   */
  constructor(config: {
    apiKey?: string;
    model?: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    super({
      apiKey: config.apiKey || '',
      model: config.model || 'llama2',
      baseURL: config.baseURL || 'http://localhost:11434',
      temperature: config.temperature,
      maxTokens: config.maxTokens
    });

    this.ollamaBaseURL = config.baseURL || 'http://localhost:11434';
  }

  /**
   * 普通聊天请求
   * @param messages 消息列表
   * @param tools 可用工具列表（Ollama 暂不支持工具调用）
   * @returns AI 响应
   */
  async chat(messages: Message[], tools?: Tool[]): Promise<AIResponse> {
    return this.retry(async () => {
      const response = await fetch(`${this.ollamaBaseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.formatMessages(messages),
          stream: false,
          options: {
            temperature: this.temperature,
            num_predict: this.maxTokens
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API 错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseResponse(data);
    });
  }

  /**
   * 流式聊天请求
   * @param messages 消息列表
   * @param tools 可用工具列表
   * @returns 流式响应生成器
   */
  async *stream(messages: Message[], tools?: Tool[]): AsyncGenerator<AIStreamChunk> {
    const response = await fetch(`${this.ollamaBaseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.formatMessages(messages),
        stream: true,
        options: {
          temperature: this.temperature,
          num_predict: this.maxTokens
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API 错误: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              
              if (data.message?.content) {
                yield {
                  content: data.message.content,
                  isComplete: data.done || false
                };
              }

              if (data.done) {
                yield {
                  isComplete: true
                };
              }
            } catch (e) {
              // 忽略解析错误的行
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield {
      isComplete: true
    };
  }

  /**
   * 格式化消息
   * @param messages 标准消息格式
   * @returns Ollama 格式的消息
   */
  protected formatMessages(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * 格式化工具（Ollama 暂不支持）
   * @param tools 标准工具格式
   * @returns undefined
   */
  protected formatTools(tools?: Tool[]): any[] | undefined {
    // Ollama 目前不支持工具调用
    return undefined;
  }

  /**
   * 解析响应
   * @param response Ollama 响应
   * @returns 标准 AI 响应格式
   */
  protected parseResponse(response: any): AIResponse {
    return {
      content: response.message?.content || '',
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
      }
    };
  }

  /**
   * 获取可用模型列表
   * @returns 模型列表
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.ollamaBaseURL}/api/tags`);
      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.status}`);
      }

      const data: any = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('获取 Ollama 模型列表失败:', error);
      return [];
    }
  }
}
