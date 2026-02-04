/**
 * GUI 控制工具
 * 控制鼠标、键盘，截取屏幕等
 */

import { Tool, ToolResult } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * GUI 工具类
 * 使用 @nut-tree/nut.js 进行 GUI 自动化
 */
export class GUITool {
  private static nut: any = null;

  /**
   * 动态加载 nut.js
   * 避免在启动时就加载
   */
  private static async getNut() {
    if (!this.nut) {
      try {
        this.nut = await import('@nut-tree-fork/nut-js');
      } catch (error) {
        console.warn('nut.js 未安装，GUI 功能将不可用');
        throw new Error('GUI 功能需要安装 @nut-tree-fork/nut-js 依赖');
      }
    }
    return this.nut;
  }

  /**
   * 获取工具定义
   * @returns 工具定义列表
   */
  static getDefinitions(): Tool[] {
    return [
      {
        name: 'screenshot',
        description: '截取屏幕截图并保存到文件',
        parameters: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: '保存路径（可选），默认保存到桌面，文件名格式: screenshot_时间戳.jpg'
            },
            region: {
              type: 'object',
              description: '截图区域 {x, y, width, height}，默认全屏',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' }
              }
            }
          }
        }
      },
      {
        name: 'mouse_click',
        description: '鼠标点击',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X 坐标' },
            y: { type: 'number', description: 'Y 坐标' },
            button: { type: 'string', description: '鼠标按钮: left/right/middle，默认left' },
            clicks: { type: 'number', description: '点击次数，默认1' }
          },
          required: ['x', 'y']
        }
      },
      {
        name: 'mouse_move',
        description: '移动鼠标',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X 坐标' },
            y: { type: 'number', description: 'Y 坐标' }
          },
          required: ['x', 'y']
        }
      },
      {
        name: 'type_text',
        description: '输入文本',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', description: '要输入的文本' },
            interval: { type: 'number', description: '按键间隔（毫秒），默认10' }
          },
          required: ['text']
        }
      },
      {
        name: 'press_key',
        description: '按下按键',
        parameters: {
          type: 'object',
          properties: {
            key: { type: 'string', description: '按键名称，如 enter, escape, tab, space 等' },
            modifiers: { 
              type: 'array', 
              description: '修饰键，如 ["control", "alt"]',
              items: { type: 'string' }
            }
          },
          required: ['key']
        }
      },
      {
        name: 'scroll',
        description: '滚动鼠标',
        parameters: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: '滚动量，正数向上，负数向下' },
            direction: { type: 'string', description: '滚动方向: up/down/left/right，默认up' }
          },
          required: ['amount']
        }
      },
      {
        name: 'get_screen_size',
        description: '获取屏幕尺寸',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  /**
   * 截取屏幕截图
   * @param filePath 保存路径（可选）
   * @param region 截图区域
   * @returns 截图结果
   */
  static async screenshot(
    filePath?: string,
    region?: { x: number; y: number; width: number; height: number }
  ): Promise<ToolResult> {
    try {
      const nut = await this.getNut();
      
      let image;
      if (region) {
        const regionObj = new nut.Region(region.x, region.y, region.width, region.height);
        image = await nut.screen.grabRegion(regionObj);
      } else {
        image = await nut.screen.grab();
      }

      // 确定保存路径
      let savePath: string;
      if (filePath) {
        // 使用用户指定的路径
        savePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
      } else {
        // 默认保存到桌面
        const desktopPath = path.join(os.homedir(), 'Desktop');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
        savePath = path.join(desktopPath, `screenshot_${timestamp}.png`);
      }

      // 确保目录存在
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 保存图片 - 使用 PNG 格式
      const imageData = image.data;
      const width = image.width;
      const height = image.height;
      
      // 创建 PNG 文件（简单的 RGBA 转换）
      const { PNG } = require('pngjs');
      const png = new PNG({ width, height });
      
      // 复制图像数据
      for (let i = 0; i < imageData.length; i++) {
        png.data[i] = imageData[i];
      }
      
      // 写入文件
      const buffer = PNG.sync.write(png);
      fs.writeFileSync(savePath, buffer);

      // 获取文件大小
      const stats = fs.statSync(savePath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);

      return {
        success: true,
        data: {
          message: '截图已保存',
          filePath: savePath,
          fileSize: `${fileSizeKB} KB`,
          region: region ? `${region.width}x${region.height}` : 'fullscreen',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `截图失败: ${error.message}`
      };
    }
  }

  /**
   * 鼠标点击
   * @param x X 坐标
   * @param y Y 坐标
   * @param button 鼠标按钮
   * @param clicks 点击次数
   * @returns 执行结果
   */
  static async mouseClick(
    x: number,
    y: number,
    button: string = 'left',
    clicks: number = 1
  ): Promise<ToolResult> {
    try {
      const nut = await this.getNut();
      
      // 移动鼠标
      await nut.mouse.move(nut.straightTo(nut.point(x, y)));

      // 点击
      const btn = this.parseMouseButton(button);
      for (let i = 0; i < clicks; i++) {
        await nut.mouse.click(btn);
      }

      return {
        success: true,
        data: {
          message: `在 (${x}, ${y}) 点击 ${clicks} 次`,
          button
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `鼠标点击失败: ${error.message}`
      };
    }
  }

  /**
   * 移动鼠标
   * @param x X 坐标
   * @param y Y 坐标
   * @returns 执行结果
   */
  static async mouseMove(x: number, y: number): Promise<ToolResult> {
    try {
      const nut = await this.getNut();
      await nut.mouse.move(nut.straightTo(nut.point(x, y)));

      return {
        success: true,
        data: {
          message: `鼠标已移动到 (${x}, ${y})`
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `鼠标移动失败: ${error.message}`
      };
    }
  }

  /**
   * 输入文本
   * @param text 要输入的文本
   * @param interval 按键间隔
   * @returns 执行结果
   */
  static async typeText(text: string, interval: number = 10): Promise<ToolResult> {
    try {
      const nut = await this.getNut();
      await nut.keyboard.type(text, interval);

      return {
        success: true,
        data: {
          message: `已输入文本: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `输入文本失败: ${error.message}`
      };
    }
  }

  /**
   * 按下按键
   * @param key 按键名称
   * @param modifiers 修饰键
   * @returns 执行结果
   */
  static async pressKey(key: string, modifiers?: string[]): Promise<ToolResult> {
    try {
      const nut = await this.getNut();
      
      const keyEnum = this.parseKey(key);
      
      if (modifiers && modifiers.length > 0) {
        // 组合键
        const modEnums = modifiers.map(m => this.parseKey(m));
        await nut.keyboard.keyCombination(...modEnums, keyEnum);
      } else {
        // 单键
        await nut.keyboard.keyTap(keyEnum);
      }

      return {
        success: true,
        data: {
          message: `按下按键: ${modifiers ? modifiers.join('+') + '+' : ''}${key}`
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `按键操作失败: ${error.message}`
      };
    }
  }

  /**
   * 滚动鼠标
   * @param amount 滚动量
   * @param direction 滚动方向
   * @returns 执行结果
   */
  static async scroll(amount: number, direction: string = 'up'): Promise<ToolResult> {
    try {
      const nut = await this.getNut();
      
      const scrollAmount = direction === 'down' || direction === 'right' ? -amount : amount;
      
      if (direction === 'left' || direction === 'right') {
        await nut.mouse.scrollLeft(scrollAmount);
      } else {
        await nut.mouse.scrollDown(scrollAmount);
      }

      return {
        success: true,
        data: {
          message: `向${direction}滚动 ${amount}`
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `滚动失败: ${error.message}`
      };
    }
  }

  /**
   * 获取屏幕尺寸
   * @returns 屏幕尺寸
   */
  static async getScreenSize(): Promise<ToolResult> {
    try {
      const nut = await this.getNut();
      const width = await nut.screen.width();
      const height = await nut.screen.height();

      return {
        success: true,
        data: {
          width,
          height,
          resolution: `${width}x${height}`
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `获取屏幕尺寸失败: ${error.message}`
      };
    }
  }

  /**
   * 解析鼠标按钮
   * @param button 按钮名称
   * @returns nut.js 按钮枚举
   */
  private static parseMouseButton(button: string): any {
    const nut = this.nut;
    switch (button.toLowerCase()) {
      case 'right':
        return nut.Button.RIGHT;
      case 'middle':
        return nut.Button.MIDDLE;
      case 'left':
      default:
        return nut.Button.LEFT;
    }
  }

  /**
   * 解析按键名称
   * @param key 按键名称
   * @returns nut.js 按键枚举
   */
  private static parseKey(key: string): any {
    const nut = this.nut;
    const keyMap: Record<string, any> = {
      'enter': nut.Key.Enter,
      'return': nut.Key.Enter,
      'escape': nut.Key.Escape,
      'esc': nut.Key.Escape,
      'tab': nut.Key.Tab,
      'space': nut.Key.Space,
      'backspace': nut.Key.Backspace,
      'delete': nut.Key.Delete,
      'del': nut.Key.Delete,
      'up': nut.Key.Up,
      'down': nut.Key.Down,
      'left': nut.Key.Left,
      'right': nut.Key.Right,
      'home': nut.Key.Home,
      'end': nut.Key.End,
      'pageup': nut.Key.PageUp,
      'pagedown': nut.Key.PageDown,
      'control': nut.Key.LeftControl,
      'ctrl': nut.Key.LeftControl,
      'alt': nut.Key.LeftAlt,
      'shift': nut.Key.LeftShift,
      'command': nut.Key.LeftCommand,
      'cmd': nut.Key.LeftCommand,
      'win': nut.Key.LeftWin,
      'f1': nut.Key.F1,
      'f2': nut.Key.F2,
      'f3': nut.Key.F3,
      'f4': nut.Key.F4,
      'f5': nut.Key.F5,
      'f6': nut.Key.F6,
      'f7': nut.Key.F7,
      'f8': nut.Key.F8,
      'f9': nut.Key.F9,
      'f10': nut.Key.F10,
      'f11': nut.Key.F11,
      'f12': nut.Key.F12
    };

    const lowerKey = key.toLowerCase();
    if (keyMap[lowerKey]) {
      return keyMap[lowerKey];
    }

    // 单字符直接返回
    if (key.length === 1) {
      return key;
    }

    throw new Error(`未知的按键: ${key}`);
  }
}
