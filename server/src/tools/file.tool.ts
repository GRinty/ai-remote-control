/**
 * 文件操作工具
 * 提供文件和文件夹的增删改查功能
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool, ToolResult } from '../types';

/**
 * 文件工具类
 */
export class FileTool {
  /**
   * 获取工具定义
   * @returns 工具定义列表
   */
  static getDefinitions(): Tool[] {
    return [
      {
        name: 'read_file',
        description: '读取文件内容',
        parameters: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: '文件路径'
            },
            encoding: {
              type: 'string',
              description: '编码格式，默认utf-8'
            }
          },
          required: ['filePath']
        }
      },
      {
        name: 'write_file',
        description: '写入文件内容',
        parameters: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: '文件路径'
            },
            content: {
              type: 'string',
              description: '文件内容'
            },
            append: {
              type: 'boolean',
              description: '是否追加模式，默认false'
            }
          },
          required: ['filePath', 'content']
        }
      },
      {
        name: 'list_directory',
        description: '列出目录内容',
        parameters: {
          type: 'object',
          properties: {
            dirPath: {
              type: 'string',
              description: '目录路径，默认当前目录'
            }
          }
        }
      },
      {
        name: 'create_directory',
        description: '创建目录',
        parameters: {
          type: 'object',
          properties: {
            dirPath: {
              type: 'string',
              description: '目录路径'
            },
            recursive: {
              type: 'boolean',
              description: '是否递归创建，默认true'
            }
          },
          required: ['dirPath']
        }
      },
      {
        name: 'delete_file',
        description: '删除文件或目录',
        parameters: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: '文件或目录路径'
            },
            recursive: {
              type: 'boolean',
              description: '递归删除目录，默认false'
            }
          },
          required: ['filePath']
        }
      },
      {
        name: 'move_file',
        description: '移动或重命名文件',
        parameters: {
          type: 'object',
          properties: {
            sourcePath: {
              type: 'string',
              description: '源路径'
            },
            targetPath: {
              type: 'string',
              description: '目标路径'
            }
          },
          required: ['sourcePath', 'targetPath']
        }
      },
      {
        name: 'file_exists',
        description: '检查文件或目录是否存在',
        parameters: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: '文件或目录路径'
            }
          },
          required: ['filePath']
        }
      }
    ];
  }

  /**
   * 读取文件
   * @param filePath 文件路径
   * @param encoding 编码格式
   * @returns 文件内容
   */
  static async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(filePath);
      const content = await fs.readFile(resolvedPath, { encoding });
      const stats = await fs.stat(resolvedPath);
      
      // 限制文件大小显示
      const maxDisplaySize = 1024 * 1024; // 1MB
      const displayContent = stats.size > maxDisplaySize 
        ? content.substring(0, maxDisplaySize) + '\n\n[文件过大，已截断...]'
        : content;
      
      return {
        success: true,
        data: {
          content: displayContent,
          filePath: resolvedPath,
          size: `${(stats.size / 1024).toFixed(2)} KB`,
          modified: stats.mtime.toISOString(),
          created: stats.birthtime.toISOString(),
          truncated: stats.size > maxDisplaySize
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `读取文件失败: ${error.message}`
      };
    }
  }

  /**
   * 写入文件
   * @param filePath 文件路径
   * @param content 文件内容
   * @param append 是否追加
   * @returns 写入结果
   */
  static async writeFile(filePath: string, content: string, append: boolean = false): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(filePath);
      
      // 确保目录存在
      const dir = path.dirname(resolvedPath);
      await fs.mkdir(dir, { recursive: true });

      if (append) {
        await fs.appendFile(resolvedPath, content, 'utf-8');
      } else {
        await fs.writeFile(resolvedPath, content, 'utf-8');
      }

      const stats = await fs.stat(resolvedPath);
      
      return {
        success: true,
        data: {
          message: append ? '内容已追加到文件' : '文件已写入',
          filePath: resolvedPath,
          size: `${(stats.size / 1024).toFixed(2)} KB`,
          contentLength: content.length
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `写入文件失败: ${error.message}`
      };
    }
  }

  /**
   * 列出目录内容
   * @param dirPath 目录路径
   * @returns 目录内容列表
   */
  static async listDirectory(dirPath: string = '.'): Promise<ToolResult> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      const items = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);
          let stats;
          
          try {
            stats = await fs.stat(fullPath);
          } catch {
            stats = null;
          }

          return {
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: stats?.size || 0,
            modified: stats?.mtime || null,
            path: fullPath
          };
        })
      );

      return {
        success: true,
        data: {
          path: path.resolve(dirPath),
          items: items.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'directory' ? -1 : 1;
          })
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `列出目录失败: ${error.message}`
      };
    }
  }

  /**
   * 创建目录
   * @param dirPath 目录路径
   * @param recursive 是否递归创建
   * @returns 创建结果
   */
  static async createDirectory(dirPath: string, recursive: boolean = true): Promise<ToolResult> {
    try {
      await fs.mkdir(dirPath, { recursive });
      
      return {
        success: true,
        data: {
          message: '目录已创建',
          path: path.resolve(dirPath)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `创建目录失败: ${error.message}`
      };
    }
  }

  /**
   * 删除文件或目录
   * @param filePath 文件或目录路径
   * @param recursive 是否递归删除
   * @returns 删除结果
   */
  static async deleteFile(filePath: string, recursive: boolean = false): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(filePath);
      
      // 安全检查：防止删除重要系统目录
      const dangerousPaths = [
        'C:\\Windows',
        'C:\\Program Files',
        'C:\\Program Files (x86)',
        '/System',
        '/usr',
        '/bin',
        '/sbin',
        '/etc'
      ];
      
      const isDangerous = dangerousPaths.some(dangerous => 
        resolvedPath.toLowerCase().startsWith(dangerous.toLowerCase())
      );
      
      if (isDangerous) {
        return {
          success: false,
          error: '拒绝删除系统关键目录'
        };
      }
      
      const stats = await fs.stat(resolvedPath);
      
      if (stats.isDirectory()) {
        if (recursive) {
          await fs.rm(resolvedPath, { recursive: true, force: true });
        } else {
          await fs.rmdir(resolvedPath);
        }
      } else {
        await fs.unlink(resolvedPath);
      }

      return {
        success: true,
        data: {
          message: stats.isDirectory() ? '目录已删除' : '文件已删除',
          path: resolvedPath,
          type: stats.isDirectory() ? 'directory' : 'file'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `删除失败: ${error.message}`
      };
    }
  }

  /**
   * 移动或重命名文件
   * @param sourcePath 源路径
   * @param targetPath 目标路径
   * @returns 移动结果
   */
  static async moveFile(sourcePath: string, targetPath: string): Promise<ToolResult> {
    try {
      // 确保目标目录存在
      const targetDir = path.dirname(targetPath);
      await fs.mkdir(targetDir, { recursive: true });

      await fs.rename(sourcePath, targetPath);

      return {
        success: true,
        data: {
          message: '文件已移动',
          from: sourcePath,
          to: targetPath
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `移动文件失败: ${error.message}`
      };
    }
  }

  /**
   * 检查文件是否存在
   * @param filePath 文件路径
   * @returns 是否存在
   */
  static async fileExists(filePath: string): Promise<ToolResult> {
    try {
      const stats = await fs.stat(filePath);
      
      return {
        success: true,
        data: {
          exists: true,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime
        }
      };
    } catch {
      return {
        success: true,
        data: {
          exists: false
        }
      };
    }
  }
}
