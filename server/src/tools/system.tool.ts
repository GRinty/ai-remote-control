/**
 * 系统操作工具
 * 执行系统命令和获取系统信息
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';
import { Tool, ToolResult } from '../types';

const execAsync = promisify(exec);

/**
 * 系统工具类
 */
export class SystemTool {
  /**
   * 获取工具定义
   * @returns 工具定义列表
   */
  static getDefinitions(): Tool[] {
    return [
      {
        name: 'execute_command',
        description: '执行系统命令（谨慎使用，避免危险命令）',
        parameters: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: '要执行的命令'
            },
            timeout: {
              type: 'number',
              description: '超时时间（毫秒），默认30000'
            }
          },
          required: ['command']
        }
      },
      {
        name: 'get_system_info',
        description: '获取系统信息（包括桌面路径、用户目录等）',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'list_processes',
        description: '列出运行中的进程',
        parameters: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              description: '进程名称过滤（可选）'
            }
          }
        }
      },
      {
        name: 'kill_process',
        description: '结束指定进程',
        parameters: {
          type: 'object',
          properties: {
            pid: {
              type: 'number',
              description: '进程ID'
            },
            name: {
              type: 'string',
              description: '进程名称（与pid二选一）'
            }
          }
        }
      }
    ];
  }

  /**
   * 执行系统命令
   * @param command 命令字符串
   * @param timeout 超时时间
   * @returns 执行结果
   */
  static async executeCommand(command: string, timeout: number = 30000): Promise<ToolResult> {
    try {
      console.log(`[SystemTool] 执行命令: ${command}`);
      
      // 检查危险命令
      const dangerousPatterns = [
        'rm -rf /',
        'del /f /s /q C:\\',
        'format',
        'dd if=',
        'mkfs',
        'shutdown',
        'reboot'
      ];

      const isDangerous = dangerousPatterns.some(pattern => 
        command.toLowerCase().includes(pattern.toLowerCase())
      );

      if (isDangerous) {
        console.log('[SystemTool] 危险命令被阻止');
        return {
          success: false,
          error: '检测到危险命令，已阻止执行'
        };
      }

      // 对于 GUI 应用程序（如 code, notepad 等），使用 spawn 而不是 exec
      const guiApps = ['code', 'notepad', 'explorer', 'chrome', 'firefox'];
      const isGuiApp = guiApps.some(app => command.toLowerCase().includes(app));
      
      if (isGuiApp && os.platform() === 'win32') {
        console.log('[SystemTool] 检测到 GUI 应用，使用 spawn 启动');
        // 在 Windows 上使用 start 命令在新窗口中启动
        const startCommand = `start "" ${command}`;
        const { stdout, stderr } = await execAsync(startCommand, { timeout });
        
        console.log(`[SystemTool] GUI 应用启动成功`);
        return {
          success: true,
          data: {
            message: 'GUI 应用已启动',
            command: command,
            stdout: stdout.trim(),
            stderr: stderr.trim()
          }
        };
      }

      const { stdout, stderr } = await execAsync(command, { timeout });
      
      console.log(`[SystemTool] 命令执行成功`);
      console.log(`[SystemTool] stdout: ${stdout.trim()}`);
      console.log(`[SystemTool] stderr: ${stderr.trim()}`);
      
      return {
        success: true,
        data: {
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          message: '命令执行成功'
        }
      };
    } catch (error: any) {
      console.error(`[SystemTool] 命令执行失败:`, error);
      return {
        success: false,
        error: error.message,
        data: {
          stdout: error.stdout || '',
          stderr: error.stderr || ''
        }
      };
    }
  }

  /**
   * 获取系统信息
   * @returns 系统信息
   */
  static async getSystemInfo(): Promise<ToolResult> {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const userInfo = os.userInfo();
      
      const info = {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        username: userInfo.username,
        homeDir: userInfo.homedir,
        desktopPath: path.join(userInfo.homedir, 'Desktop'),
        cpu: {
          model: os.cpus()[0]?.model || 'Unknown',
          cores: os.cpus().length,
          speed: os.cpus()[0]?.speed || 0
        },
        memory: {
          total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
          free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
          used: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
          usagePercent: `${((usedMem / totalMem) * 100).toFixed(2)}%`
        },
        uptime: {
          hours: Math.floor(os.uptime() / 3600),
          formatted: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`
        },
        nodeVersion: process.version
      };

      return {
        success: true,
        data: info
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 列出进程
   * @param filter 进程名称过滤
   * @returns 进程列表
   */
  static async listProcesses(filter?: string): Promise<ToolResult> {
    try {
      let command: string;
      
      if (os.platform() === 'win32') {
        command = 'tasklist /fo csv /nh';
      } else {
        command = 'ps aux';
      }

      const { stdout } = await execAsync(command);
      let processes = stdout.split('\n').filter(line => line.trim());

      // 过滤进程
      if (filter) {
        processes = processes.filter(line => 
          line.toLowerCase().includes(filter.toLowerCase())
        );
      }

      // 解析进程信息
      const parsed = processes.slice(0, 50).map(line => {
        if (os.platform() === 'win32') {
          const parts = line.split('","');
          return {
            name: parts[0]?.replace('"', ''),
            pid: parts[1],
            memory: parts[4]
          };
        } else {
          const parts = line.trim().split(/\s+/);
          return {
            user: parts[0],
            pid: parts[1],
            cpu: parts[2],
            mem: parts[3],
            command: parts.slice(10).join(' ')
          };
        }
      });

      return {
        success: true,
        data: parsed
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 结束进程
   * @param pid 进程ID
   * @param name 进程名称
   * @returns 执行结果
   */
  static async killProcess(pid?: number, name?: string): Promise<ToolResult> {
    try {
      let command: string;

      if (pid) {
        if (os.platform() === 'win32') {
          command = `taskkill /PID ${pid} /F`;
        } else {
          command = `kill -9 ${pid}`;
        }
      } else if (name) {
        if (os.platform() === 'win32') {
          command = `taskkill /IM "${name}" /F`;
        } else {
          command = `pkill -9 "${name}"`;
        }
      } else {
        return {
          success: false,
          error: '必须提供进程ID或进程名称'
        };
      }

      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        data: {
          message: '进程已结束',
          output: stdout || stderr
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
