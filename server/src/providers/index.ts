/**
 * AI 提供者工厂模块
 * 统一管理所有 AI 提供者的创建和访问
 */

import { IAIProvider } from '../types';
import { DeepSeekProvider } from './deepseek.provider';
import { OpenAIProvider } from './openai.provider';
import { ClaudeProvider } from './claude.provider';
import { OllamaProvider } from './ollama.provider';
import { MiniMaxProvider } from './minimax.provider';

/**
 * 提供者配置接口
 */
interface ProviderConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 创建 AI 提供者实例
 * @param provider 提供者名称
 * @param config 配置对象
 * @returns AI 提供者实例
 * @throws 不支持的提供者时抛出错误
 */
export function createProvider(provider: string, config: ProviderConfig): IAIProvider {
  switch (provider.toLowerCase()) {
    case 'deepseek':
      return new DeepSeekProvider(config);

    case 'openai':
      return new OpenAIProvider(config);

    case 'claude':
    case 'anthropic':
      return new ClaudeProvider(config);

    case 'ollama':
      return new OllamaProvider(config);

    case 'minimax':
      return new MiniMaxProvider(config);

    default:
      throw new Error(`不支持的 AI 提供者: ${provider}`);
  }
}

/**
 * 获取支持的提供者列表
 * @returns 提供者名称列表
 */
export function getSupportedProviders(): string[] {
  return ['deepseek', 'openai', 'claude', 'ollama', 'minimax'];
}

/**
 * 获取提供者的默认模型
 * @param provider 提供者名称
 * @returns 默认模型名称
 */
export function getDefaultModel(provider: string): string {
  switch (provider.toLowerCase()) {
    case 'deepseek':
      return 'deepseek-chat';
    case 'openai':
      return 'gpt-4';
    case 'claude':
      return 'claude-3-sonnet-20240229';
    case 'ollama':
      return 'llama2';
    case 'minimax':
      return 'MiniMax-Text-01';
    default:
      return '';
  }
}

// 导出所有提供者类
export { DeepSeekProvider } from './deepseek.provider';
export { OpenAIProvider } from './openai.provider';
export { ClaudeProvider } from './claude.provider';
export { OllamaProvider } from './ollama.provider';
export { MiniMaxProvider } from './minimax.provider';
export { BaseAIProvider } from './base.provider';
