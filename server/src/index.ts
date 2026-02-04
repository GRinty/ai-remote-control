/**
 * 应用程序入口
 */

import { validateConfig } from './config';
import { startServer } from './server';

/**
 * 主函数
 */
async function main() {
  try {
    // 验证配置
    validateConfig();
    
    // 启动服务器
    startServer();
  } catch (error: any) {
    console.error('启动失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();
