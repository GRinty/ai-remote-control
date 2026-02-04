/**
 * 配置管理模块
 * 加载和管理应用程序配置
 */

import { Config } from '../types';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * 获取配置
 * @returns 应用程序配置对象
 */
export function getConfig(): Config {
  return {
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0'
    },
    ai: {
      provider: process.env.AI_PROVIDER || 'deepseek',
      model: process.env.AI_MODEL || 'deepseek-chat',
      apiKey: process.env.AI_API_KEY || '',
      baseURL: process.env.AI_BASE_URL,
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10)
    },
    security: {
      requireConfirmation: process.env.REQUIRE_CONFIRMATION === 'true',
      dangerousCommands: [
        'rm -rf',
        'del /f /s /q',
        'format',
        'dd if=',
        'mkfs',
        'shutdown',
        'reboot',
        'reg delete',
        'rd /s /q'
      ],
      maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS || '3', 10)
    }
  };
}

/**
 * 验证配置
 * @throws 配置无效时抛出错误
 */
export function validateConfig(): void {
  const config = getConfig();
  
  if (!config.ai.apiKey) {
    throw new Error('AI_API_KEY 未设置，请在 .env 文件中配置');
  }
  
  const supportedProviders = ['deepseek', 'openai', 'claude', 'zhipu', 'ollama', 'minimax'];
  if (!supportedProviders.includes(config.ai.provider)) {
    throw new Error(`不支持的 AI 提供商: ${config.ai.provider}，支持的提供商: ${supportedProviders.join(', ')}`);
  }
}

export default getConfig;
