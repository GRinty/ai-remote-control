/**
 * AI 服务
 * 封装 AI 提供者的调用，提供统一的接口
 */

import { IAIProvider, Message, Tool, AIResponse, AIStreamChunk } from '../types';
import { createProvider, getDefaultModel } from '../providers';
import { getConfig } from '../config';
import { toolRegistry } from '../tools';

/**
 * AI 服务类
 */
export class AIService {
  private provider: IAIProvider;
  private systemPrompt: string;

  /**
   * 构造函数
   */
  constructor() {
    const config = getConfig();
    
    // 创建 AI 提供者
    this.provider = createProvider(config.ai.provider, {
      apiKey: config.ai.apiKey,
      model: config.ai.model || getDefaultModel(config.ai.provider),
      baseURL: config.ai.baseURL,
      temperature: config.ai.temperature,
      maxTokens: config.ai.maxTokens
    });

    // 设置系统提示词
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * 构建系统提示词
   * @returns 系统提示词
   */
  private buildSystemPrompt(): string {
    const tools = toolRegistry.getAllDefinitions();
    
    return `你是一个智能助手，可以通过工具控制用户的电脑。

你可以使用以下工具来完成任务：

${tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

重要规则：
1. 直接执行用户的请求，不要过度探索
2. 每次工具执行后，你必须用文字向用户报告结果，不要立即调用下一个工具
3. 例如：创建文件后，说"文件已创建成功"，而不是再次调用工具
4. 如果任务需要多个步骤，在报告当前步骤结果后，再调用下一个工具
5. 不要重复调用相同的工具和参数
6. Windows 桌面路径：C:\\Users\\[用户名]\\Desktop（可从系统信息获取）

请根据用户的需求，高效地完成任务，并及时报告进度。`;
  }

  /**
   * 发送消息并获取响应
   * @param messages 消息列表
   * @param useTools 是否使用工具
   * @returns AI 响应
   */
  async chat(messages: Message[], useTools: boolean = true): Promise<AIResponse> {
    // 添加系统消息
    const fullMessages = [
      { role: 'system' as const, content: this.systemPrompt },
      ...messages
    ];

    // 获取工具定义
    const tools = useTools ? toolRegistry.getAllDefinitions() : undefined;

    // 调用 AI
    return this.provider.chat(fullMessages, tools);
  }

  /**
   * 流式发送消息
   * @param messages 消息列表
   * @param useTools 是否使用工具
   * @returns 流式响应生成器
   */
  async *stream(messages: Message[], useTools: boolean = true): AsyncGenerator<AIStreamChunk> {
    // 添加系统消息
    const fullMessages = [
      { role: 'system' as const, content: this.systemPrompt },
      ...messages
    ];

    // 获取工具定义
    const tools = useTools ? toolRegistry.getAllDefinitions() : undefined;

    // 流式调用 AI
    yield* this.provider.stream(fullMessages, tools);
  }

  /**
   * 获取当前 AI 提供者名称
   * @returns 提供者名称
   */
  getProviderName(): string {
    return this.provider.name;
  }

  /**
   * 获取可用工具列表
   * @returns 工具列表
   */
  getAvailableTools(): Tool[] {
    return toolRegistry.getAllDefinitions();
  }

  /**
   * 更新系统提示词
   * @param prompt 新的系统提示词
   */
  updateSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  /**
   * 添加自定义工具到系统提示词
   * @param toolDescription 工具描述
   */
  addToolToPrompt(toolDescription: string): void {
    this.systemPrompt += `\n${toolDescription}`;
  }
}

// 导出单例实例
export const aiService = new AIService();
