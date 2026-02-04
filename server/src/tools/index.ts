/**
 * 工具注册和管理模块
 * 统一管理所有可用工具
 */

import { Tool, ToolResult } from '../types';
import { SystemTool } from './system.tool';
import { FileTool } from './file.tool';
import { GUITool } from './gui.tool';
import { BrowserTool } from './browser.tool';

/**
 * 工具注册表
 * 存储所有可用工具的定义和执行函数
 */
class ToolRegistry {
  private tools: Map<string, { definition: Tool; execute: Function }> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * 注册默认工具
   */
  private registerDefaultTools() {
    // 注册系统工具
    SystemTool.getDefinitions().forEach(tool => {
      this.register(tool, async (params: any) => {
        switch (tool.name) {
          case 'execute_command':
            return SystemTool.executeCommand(params.command, params.timeout);
          case 'get_system_info':
            return SystemTool.getSystemInfo();
          case 'list_processes':
            return SystemTool.listProcesses(params.filter);
          case 'kill_process':
            return SystemTool.killProcess(params.pid, params.name);
          default:
            throw new Error(`未知工具: ${tool.name}`);
        }
      });
    });

    // 注册文件工具
    FileTool.getDefinitions().forEach(tool => {
      this.register(tool, async (params: any) => {
        switch (tool.name) {
          case 'read_file':
            return FileTool.readFile(params.filePath, params.encoding);
          case 'write_file':
            return FileTool.writeFile(params.filePath, params.content, params.append);
          case 'list_directory':
            return FileTool.listDirectory(params.dirPath);
          case 'create_directory':
            return FileTool.createDirectory(params.dirPath, params.recursive);
          case 'delete_file':
            return FileTool.deleteFile(params.filePath, params.recursive);
          case 'move_file':
            return FileTool.moveFile(params.sourcePath, params.targetPath);
          case 'file_exists':
            return FileTool.fileExists(params.filePath);
          default:
            throw new Error(`未知工具: ${tool.name}`);
        }
      });
    });

    // 注册 GUI 工具
    GUITool.getDefinitions().forEach(tool => {
      this.register(tool, async (params: any) => {
        switch (tool.name) {
          case 'screenshot':
            return GUITool.screenshot(params.filePath, params.region);
          case 'mouse_click':
            return GUITool.mouseClick(params.x, params.y, params.button, params.clicks);
          case 'mouse_move':
            return GUITool.mouseMove(params.x, params.y);
          case 'type_text':
            return GUITool.typeText(params.text, params.interval);
          case 'press_key':
            return GUITool.pressKey(params.key, params.modifiers);
          case 'scroll':
            return GUITool.scroll(params.amount, params.direction);
          case 'get_screen_size':
            return GUITool.getScreenSize();
          default:
            throw new Error(`未知工具: ${tool.name}`);
        }
      });
    });

    // 注册浏览器工具
    BrowserTool.getDefinitions().forEach(tool => {
      this.register(tool, async (params: any) => {
        switch (tool.name) {
          case 'browser_navigate':
            return BrowserTool.navigate(params.url);
          case 'browser_click':
            return BrowserTool.click(params.selector);
          case 'browser_type':
            return BrowserTool.type(params.selector, params.text, params.clear);
          case 'browser_get_text':
            return BrowserTool.getText(params.selector);
          case 'browser_screenshot':
            return BrowserTool.screenshot(params.filePath, params.fullPage);
          case 'browser_scroll':
            return BrowserTool.scroll(params.direction, params.amount);
          case 'browser_go_back':
            return BrowserTool.goBack();
          case 'browser_close':
            return BrowserTool.close();
          default:
            throw new Error(`未知工具: ${tool.name}`);
        }
      });
    });
  }

  /**
   * 注册工具
   * @param definition 工具定义
   * @param execute 执行函数
   */
  register(definition: Tool, execute: Function) {
    this.tools.set(definition.name, { definition, execute });
  }

  /**
   * 获取工具定义
   * @param name 工具名称
   * @returns 工具定义
   */
  getDefinition(name: string): Tool | undefined {
    return this.tools.get(name)?.definition;
  }

  /**
   * 获取所有工具定义
   * @returns 工具定义列表
   */
  getAllDefinitions(): Tool[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  /**
   * 执行工具
   * @param name 工具名称
   * @param params 工具参数
   * @returns 执行结果
   */
  async execute(name: string, params: any): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `工具不存在: ${name}`
      };
    }

    try {
      return await tool.execute(params);
    } catch (error: any) {
      return {
        success: false,
        error: `工具执行失败: ${error.message}`
      };
    }
  }

  /**
   * 检查工具是否存在
   * @param name 工具名称
   * @returns 是否存在
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }
}

// 导出单例实例
export const toolRegistry = new ToolRegistry();

// 导出工具类
export { SystemTool } from './system.tool';
export { FileTool } from './file.tool';
export { GUITool } from './gui.tool';
export { BrowserTool } from './browser.tool';
