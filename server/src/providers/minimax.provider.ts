/**
 * MiniMax AI 提供者实现
 * 通过 Anthropic API 格式使用 MiniMax 模型
 */

import fetch from 'node-fetch';
import { BaseAIProvider } from './base.provider';
import { Message, Tool, AIResponse, AIStreamChunk } from '../types';

/**
 * MiniMax 提供者类
 * 使用 Anthropic API 格式
 */
export class MiniMaxProvider extends BaseAIProvider {
  readonly name = 'MiniMax';

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
      model: config.model || 'MiniMax-M2.1',
      baseURL: config.baseURL || 'https://api.minimaxi.com/anthropic',
      temperature: config.temperature,
      maxTokens: config.maxTokens
    });
  }

  /**
   * 格式化消息为 Anthropic 格式
   * @param messages 标准消息格式
   * @returns Anthropic 消息格式
   */
  protected formatMessages(messages: Message[]): any[] {
    return messages.map(m => ({
      role: m.role,
      content: m.content
    }));
  }

  /**
   * 格式化工具为 Anthropic 格式
   * @param tools 标准工具格式
   * @returns Anthropic 工具格式
   */
  protected formatTools(tools?: Tool[]): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;

    return tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters
    }));
  }

  /**
   * 解析 Anthropic 响应为标准格式
   * @param response Anthropic 响应
   * @returns 标准 AI 响应格式
   */
  protected parseResponse(response: any): AIResponse {
    const content = response.content || [];
    let textContent = '';
    let thinkingContent = '';
    const toolCalls: any[] = [];

    for (const block of content) {
      if (block.type === 'text') {
        textContent += block.text;
      } else if (block.type === 'thinking') {
        thinkingContent += block.thinking;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id || `call-${Date.now()}`,
          name: block.name || '',
          arguments: block.input || {}
        });
      }
    }

    // 如果有思考内容，将其包装在标记中
    const finalContent = thinkingContent
      ? `[思考]${thinkingContent}[/思考]${textContent}`
      : textContent;

    return {
      content: finalContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      }
    };
  }

  /**
   * 普通聊天请求
   * @param messages 消息列表
   * @param tools 可用工具列表
   * @returns AI 响应
   */
  async chat(messages: Message[], tools?: Tool[]): Promise<AIResponse> {
    return this.retry(async () => {
      const systemMessage = messages.find(m => m.role === 'system');
      const chatMessages = messages.filter(m => m.role !== 'system');

      const body: any = {
        model: this.model,
        messages: this.formatMessages(chatMessages),
        max_tokens: this.maxTokens || 4096
      };

      if (systemMessage) {
        body.system = systemMessage.content;
      }

      const formattedTools = this.formatTools(tools);
      if (formattedTools) {
        body.tools = formattedTools;
      }

      console.log('MiniMax API 请求:', JSON.stringify(body, null, 2));

      const response = await fetch(`${this.baseURL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('MiniMax API 错误:', response.status, error);
        throw new Error(`MiniMax API 错误: ${response.status} - ${error}`);
      }

      const data = await response.json();
      console.log('MiniMax API 响应:', JSON.stringify(data, null, 2));
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
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const body: any = {
      model: this.model,
      messages: this.formatMessages(chatMessages),
      max_tokens: this.maxTokens || 4096,
      stream: true
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    const formattedTools = this.formatTools(tools);
    if (formattedTools) {
      body.tools = formattedTools;
    }

    console.log('MiniMax 流式请求:', JSON.stringify(body, null, 2));

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('MiniMax API 错误:', response.status, error);
      throw new Error(`MiniMax API 错误: ${response.status} - ${error}`);
    }

    console.log('MiniMax 流式响应开始');

    // node-fetch 使用不同的流处理方式
    const bodyStream = response.body;
    if (!bodyStream) {
      throw new Error('无法读取响应流');
    }

    let buffer = '';
    let hasYieldThinking = false;
    let currentToolCall: any = null;
    let fullTextContent = ''; // 收集完整的文本内容用于解析 XML 工具调用

    // 监听数据
    for await (const chunk of bodyStream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            yield { isComplete: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            console.log('[MiniMax Stream] 收到事件:', JSON.stringify(parsed, null, 2));
            
            const delta = parsed.delta;
            const contentBlock = parsed.content_block;

            // 处理思考内容 - 只在第一次收到时发送标记
            if (delta?.type === 'thinking_delta' && delta?.thinking) {
              if (!hasYieldThinking) {
                hasYieldThinking = true;
                yield { content: '[思考]', isComplete: false };
              }
              yield { content: delta.thinking, isComplete: false };
            }

            // 处理文本内容
            if (delta?.type === 'text_delta' && delta?.text) {
              // 收集文本内容
              fullTextContent += delta.text;
              
              // 如果之前有思考内容，先关闭思考标记
              if (hasYieldThinking) {
                hasYieldThinking = false;
                yield { content: '[/思考]', isComplete: false };
              }
              yield { content: delta.text, isComplete: false };
            }

            // 处理工具调用开始
            if (contentBlock?.type === 'tool_use') {
              console.log('[MiniMax Stream] 检测到工具调用:', contentBlock);
              currentToolCall = {
                id: contentBlock.id || `call-${Date.now()}`,
                name: contentBlock.name || '',
                arguments: ''
              };
            }

            // 处理工具调用参数
            if (delta?.type === 'input_json_delta' && delta?.partial_json) {
              console.log('[MiniMax Stream] 收到工具参数:', delta.partial_json);
              if (currentToolCall) {
                currentToolCall.arguments += delta.partial_json;
              }
            }

            // 当消息完成时
            if (parsed.type === 'message_stop') {
              console.log('[MiniMax Stream] 消息结束');
              console.log('[MiniMax Stream] 完整文本内容:', fullTextContent);
              
              // 如果思考标记还没关闭，先关闭它
              if (hasYieldThinking) {
                yield { content: '[/思考]', isComplete: false };
              }
              
              // 解析 MiniMax 的 XML 格式工具调用
              const toolCallMatches = fullTextContent.matchAll(/<minimax:tool_call>\s*<invoke name="([^"]+)">\s*(?:<parameters>(.*?)<\/parameters>)?\s*<\/invoke>\s*<\/minimax:tool_call>/gs);
              
              for (const match of toolCallMatches) {
                const toolName = match[1];
                const paramsXml = match[2] || '';
                
                console.log('[MiniMax Stream] 解析到工具调用:', toolName, paramsXml);
                
                // 解析参数（简单的 XML 解析）
                let params: any = {};
                if (paramsXml) {
                  const paramMatches = paramsXml.matchAll(/<(\w+)>(.*?)<\/\1>/gs);
                  for (const paramMatch of paramMatches) {
                    params[paramMatch[1]] = paramMatch[2];
                  }
                }
                
                console.log('[MiniMax Stream] 发送工具调用:', { toolName, params });
                yield {
                  toolCall: {
                    id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: toolName,
                    arguments: params
                  },
                  isComplete: false
                };
              }
              
              // 如果有标准格式的工具调用也处理
              if (currentToolCall) {
                console.log('[MiniMax Stream] 发送标准格式工具调用:', currentToolCall);
                try {
                  yield {
                    toolCall: {
                      id: currentToolCall.id,
                      name: currentToolCall.name,
                      arguments: JSON.parse(currentToolCall.arguments || '{}')
                    },
                    isComplete: false
                  };
                } catch (e) {
                  console.error('解析工具参数失败:', e);
                }
                currentToolCall = null;
              }
              
              yield { isComplete: true };
              return;
            }
          } catch (e) {
            console.error('解析流式数据失败:', e, data);
          }
        }
      }
    }

    yield { isComplete: true };
  }

  /**
   * 获取可用模型列表
   * @returns 模型列表
   */
  async listModels(): Promise<string[]> {
    return [
      'MiniMax-Text-01',
      'MiniMax-M2.1',
      'abab6.5s-chat',
      'abab6.5-chat',
      'abab6-chat',
      'abab5.5s-chat',
      'abab5.5-chat'
    ];
  }
}
