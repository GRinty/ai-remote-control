/**
 * 任务执行器
 * 负责执行 AI 生成的任务计划
 */

import { ToolCall, ToolResult, Task, TaskStatus } from '../types';
import { toolRegistry } from '../tools';

/**
 * 任务执行器类
 */
export class TaskExecutor {
  private runningTasks: Map<string, Task> = new Map();
  private onTaskUpdate?: (task: Task) => void;
  private onToolCall?: (toolCall: ToolCall) => void;
  private onToolResult?: (result: ToolResult) => void;

  /**
   * 设置回调函数
   * @param callbacks 回调函数对象
   */
  setCallbacks(callbacks: {
    onTaskUpdate?: (task: Task) => void;
    onToolCall?: (toolCall: ToolCall) => void;
    onToolResult?: (result: ToolResult) => void;
  }) {
    this.onTaskUpdate = callbacks.onTaskUpdate;
    this.onToolCall = callbacks.onToolCall;
    this.onToolResult = callbacks.onToolResult;
  }

  /**
   * 执行任务
   * @param task 任务对象
   * @returns 执行结果
   */
  async execute(task: Task): Promise<Task> {
    // 更新任务状态为运行中
    task.status = 'running';
    task.updatedAt = Date.now();
    this.runningTasks.set(task.id, task);
    this.onTaskUpdate?.(task);

    try {
      // 执行工具调用
      const result = await this.executeToolCall(task.params as ToolCall);
      
      // 更新任务结果
      task.result = result;
      task.status = result.success ? 'completed' : 'failed';
      task.updatedAt = Date.now();
    } catch (error: any) {
      task.error = error.message;
      task.status = 'failed';
      task.updatedAt = Date.now();
    }

    this.runningTasks.delete(task.id);
    this.onTaskUpdate?.(task);

    return task;
  }

  /**
   * 执行工具调用
   * @param toolCall 工具调用对象
   * @returns 执行结果
   */
  async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    // 发送工具调用通知
    this.onToolCall?.(toolCall);

    // 执行工具
    const result = await toolRegistry.execute(toolCall.name, toolCall.arguments);

    // 发送工具结果通知
    this.onToolResult?.(result);

    return result;
  }

  /**
   * 批量执行工具调用
   * @param toolCalls 工具调用列表
   * @returns 执行结果列表
   */
  async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.executeToolCall(toolCall);
      results.push(result);

      // 如果执行失败，停止后续执行
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * 取消任务
   * @param taskId 任务ID
   * @returns 是否成功取消
   */
  cancelTask(taskId: string): boolean {
    const task = this.runningTasks.get(taskId);
    if (task && task.status === 'running') {
      task.status = 'cancelled';
      task.updatedAt = Date.now();
      this.runningTasks.delete(taskId);
      this.onTaskUpdate?.(task);
      return true;
    }
    return false;
  }

  /**
   * 获取运行中的任务
   * @returns 任务列表
   */
  getRunningTasks(): Task[] {
    return Array.from(this.runningTasks.values());
  }

  /**
   * 检查任务是否正在运行
   * @param taskId 任务ID
   * @returns 是否正在运行
   */
  isTaskRunning(taskId: string): boolean {
    const task = this.runningTasks.get(taskId);
    return task?.status === 'running';
  }

  /**
   * 生成任务ID
   * @returns 唯一任务ID
   */
  generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建任务
   * @param type 任务类型
   * @param params 任务参数
   * @returns 任务对象
   */
  createTask(type: string, params: any): Task {
    const now = Date.now();
    return {
      id: this.generateTaskId(),
      type,
      params,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
  }
}

// 导出单例实例
export const taskExecutor = new TaskExecutor();
