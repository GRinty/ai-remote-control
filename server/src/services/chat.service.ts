/**
 * 聊天服务
 * 管理聊天会话和消息历史
 */

import { Message, ChatSession, AIStreamChunk } from '../types';
import { aiService } from './ai.service';
import { taskExecutor } from '../executor/task.executor';

/**
 * 聊天服务类
 */
export class ChatService {
  private sessions: Map<string, ChatSession> = new Map();

  /**
   * 创建新会话
   * @returns 会话对象
   */
  createSession(): ChatSession {
    const now = Date.now();
    const session: ChatSession = {
      id: `session-${now}-${Math.random().toString(36).substr(2, 9)}`,
      messages: [],
      createdAt: now,
      updatedAt: now
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * 获取会话
   * @param sessionId 会话ID
   * @returns 会话对象
   */
  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 获取所有会话
   * @returns 会话列表
   */
  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 删除会话
   * @param sessionId 会话ID
   * @returns 是否成功删除
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * 添加消息到会话
   * @param sessionId 会话ID
   * @param message 消息对象
   */
  addMessage(sessionId: string, message: Message): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push({
        ...message,
        timestamp: Date.now()
      });
      session.updatedAt = Date.now();
    }
  }

  /**
   * 获取会话消息历史
   * @param sessionId 会话ID
   * @param limit 限制消息数量
   * @returns 消息列表
   */
  getMessages(sessionId: string, limit?: number): Message[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const messages = session.messages;
    if (limit && limit > 0) {
      return messages.slice(-limit);
    }
    return messages;
  }

  /**
   * 清空会话消息
   * @param sessionId 会话ID
   */
  clearMessages(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages = [];
      session.updatedAt = Date.now();
    }
  }

  /**
   * 处理用户消息（流式响应）
   * @param sessionId 会话ID
   * @param content 用户消息内容
   * @param callbacks 回调函数
   */
  async processMessageStream(
    sessionId: string,
    content: string,
    callbacks: {
      onChunk: (chunk: AIStreamChunk) => void;
      onToolCall?: (toolCall: any) => void;
      onToolResult?: (result: any) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ): Promise<void> {
    try {
      console.log(`[ChatService] 开始处理消息，sessionId: ${sessionId}, content: ${content}`);

      // 获取或创建会话
      let session = this.sessions.get(sessionId);
      if (!session) {
        console.log(`[ChatService] 创建新会话: ${sessionId}`);
        session = this.createSession();
      }

      // 添加用户消息
      this.addMessage(sessionId, { role: 'user', content });

      // 最多执行 5 轮工具调用（防止无限循环）
      const maxRounds = 5;
      let currentRound = 0;

      while (currentRound < maxRounds) {
        currentRound++;
        console.log(`[ChatService] 第 ${currentRound} 轮处理`);

        // 获取消息历史
        const messages = this.getMessages(sessionId, 20);
        console.log(`[ChatService] 消息历史数量: ${messages.length}`);

        // 流式调用 AI
        let assistantContent = '';
        let pendingToolCalls: any[] = [];

        console.log('[ChatService] 开始流式调用 AI...');
        for await (const chunk of aiService.stream(messages)) {
          console.log('[ChatService] 收到 chunk:', chunk);
          callbacks.onChunk(chunk);

          // 收集内容
          if (chunk.content) {
            assistantContent += chunk.content;
          }

          // 收集工具调用
          if (chunk.toolCall) {
            pendingToolCalls.push(chunk.toolCall);
          }

          // 流结束
          if (chunk.isComplete) {
            break;
          }
        }

        console.log(`[ChatService] 流式响应完成，assistantContent:`);
        console.log(assistantContent);

        // 只移除工具调用标记，保留思考内容
        const cleanContent = assistantContent
          .replace(/<minimax:tool_call>.*?<\/minimax:tool_call>/gs, '')
          .trim();
        console.log(`[ChatService] 清理后的内容: ${cleanContent.substring(0, 100)}...`);

        // 添加助手消息
        if (cleanContent) {
          this.addMessage(sessionId, { role: 'assistant', content: cleanContent });
        }

        // 如果没有工具调用，说明任务完成
        if (pendingToolCalls.length === 0) {
          console.log('[ChatService] 没有工具调用，任务完成');
          break;
        }

        // 执行工具调用
        console.log(`[ChatService] 执行工具调用，数量: ${pendingToolCalls.length}`);
        for (const toolCall of pendingToolCalls) {
          callbacks.onToolCall?.(toolCall);

          // 执行任务
          const task = taskExecutor.createTask('tool_call', toolCall);
          const result = await taskExecutor.execute(task);

          callbacks.onToolResult?.(result.result);

          // 将工具结果添加到消息历史
          const toolResultMessage = `工具 ${toolCall.name} 执行结果: ${JSON.stringify(result.result)}`;
          this.addMessage(sessionId, { role: 'system', content: toolResultMessage });
        }

        // 获取 AI 对工具结果的响应
        const updatedMessages = this.getMessages(sessionId, 20);
        let followUpContent = '';
        let hasMoreToolCalls = false;

        console.log('[ChatService] 获取工具结果后的 AI 响应...');
        let newToolCalls: any[] = [];
        
        for await (const chunk of aiService.stream(updatedMessages, true)) {
          console.log('[ChatService] 工具结果 chunk:', chunk);
          if (chunk.content) {
            followUpContent += chunk.content;
            callbacks.onChunk(chunk);
          }
          if (chunk.toolCall) {
            // 收集新的工具调用
            newToolCalls.push(chunk.toolCall);
            callbacks.onToolCall?.(chunk.toolCall);
          }
          if (chunk.isComplete) break;
        }

        console.log(`[ChatService] 工具结果响应完成，内容长度: ${followUpContent.length}, 新工具调用: ${newToolCalls.length}`);
        
        // 只清理工具调用标记，保留思考内容
        const cleanFollowUpContent = followUpContent
          .replace(/<minimax:tool_call>.*?<\/minimax:tool_call>/gs, '')
          .trim();
        
        // 添加后续响应到消息历史
        if (cleanFollowUpContent) {
          this.addMessage(sessionId, { role: 'assistant', content: cleanFollowUpContent });
        }

        // 如果 AI 没有返回任何文本内容，只是调用了工具，这可能是个循环
        // 检查是否在重复调用相同的工具
        if (!cleanFollowUpContent && newToolCalls.length > 0) {
          const lastToolCall = pendingToolCalls[pendingToolCalls.length - 1];
          const newToolCall = newToolCalls[0];
          
          if (lastToolCall && newToolCall && 
              lastToolCall.name === newToolCall.name &&
              JSON.stringify(lastToolCall.arguments) === JSON.stringify(newToolCall.arguments)) {
            console.log('[ChatService] 检测到重复的工具调用，停止循环');
            callbacks.onChunk({ 
              content: '\n\n任务已完成。', 
              isComplete: false 
            });
            break;
          }
        }

        // 如果有新的工具调用，执行它们
        if (newToolCalls.length > 0) {
          console.log(`[ChatService] 检测到 ${newToolCalls.length} 个新的工具调用`);
          for (const toolCall of newToolCalls) {
            const task = taskExecutor.createTask('tool_call', toolCall);
            const result = await taskExecutor.execute(task);
            callbacks.onToolResult?.(result.result);
            const toolResultMessage = `工具 ${toolCall.name} 执行结果: ${JSON.stringify(result.result)}`;
            this.addMessage(sessionId, { role: 'system', content: toolResultMessage });
          }
          // 继续下一轮
          continue;
        }

        // 没有新的工具调用，任务完成
        console.log('[ChatService] 没有更多工具调用，任务完成');
        break;
      }

      if (currentRound >= maxRounds) {
        console.log('[ChatService] 达到最大轮数限制，停止处理');
        callbacks.onChunk({ 
          content: '\n\n[已达到最大处理轮数，任务可能未完全完成]', 
          isComplete: false 
        });
      }

      console.log('[ChatService] 处理完成');
      callbacks.onComplete();
    } catch (error) {
      console.error('[ChatService] 处理消息时出错:', error);
      callbacks.onError(error as Error);
    }
  }

  /**
   * 处理用户消息（非流式）
   * @param sessionId 会话ID
   * @param content 用户消息内容
   * @returns 助手响应
   */
  async processMessage(sessionId: string, content: string): Promise<{
    content: string;
    toolCalls?: any[];
    toolResults?: any[];
  }> {
    // 获取或创建会话
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession();
    }

    // 添加用户消息
    this.addMessage(sessionId, { role: 'user', content });

    // 获取消息历史
    const messages = this.getMessages(sessionId, 20);

    // 调用 AI
    const response = await aiService.chat(messages);

    // 添加助手消息
    this.addMessage(sessionId, { role: 'assistant', content: response.content });

    const result: any = {
      content: response.content
    };

    // 执行工具调用
    if (response.toolCalls && response.toolCalls.length > 0) {
      result.toolCalls = response.toolCalls;
      result.toolResults = [];

      for (const toolCall of response.toolCalls) {
        const task = taskExecutor.createTask('tool_call', toolCall);
        const taskResult = await taskExecutor.execute(task);
        result.toolResults.push(taskResult.result);

        // 将工具结果添加到消息历史
        const toolResultMessage = `工具执行结果: ${JSON.stringify(taskResult.result)}`;
        this.addMessage(sessionId, { role: 'system', content: toolResultMessage });
      }

      // 获取 AI 对工具结果的响应
      const updatedMessages = this.getMessages(sessionId, 20);
      const followUpResponse = await aiService.chat(updatedMessages, false);
      
      result.content = followUpResponse.content;
      this.addMessage(sessionId, { role: 'assistant', content: followUpResponse.content });
    }

    return result;
  }
}

// 导出单例实例
export const chatService = new ChatService();
