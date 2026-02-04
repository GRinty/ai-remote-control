/**
 * 浏览器自动化工具
 * 使用 Puppeteer 控制浏览器
 */

import { Tool, ToolResult } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * 浏览器工具类
 */
export class BrowserTool {
  private static puppeteer: any = null;
  private static browser: any = null;
  private static page: any = null;

  /**
   * 动态加载 puppeteer
   */
  private static async getPuppeteer() {
    if (!this.puppeteer) {
      try {
        this.puppeteer = await import('puppeteer');
      } catch (error) {
        console.warn('puppeteer 未安装，浏览器功能将不可用');
        throw new Error('浏览器功能需要安装 puppeteer 依赖');
      }
    }
    return this.puppeteer;
  }

  /**
   * 获取或创建浏览器实例
   */
  private static async getBrowser() {
    if (!this.browser) {
      const puppeteer = await this.getPuppeteer();
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 720 }
      });
    }
    return this.browser;
  }

  /**
   * 获取或创建页面实例
   */
  private static async getPage() {
    if (!this.page) {
      const browser = await this.getBrowser();
      const pages = await browser.pages();
      this.page = pages[0] || await browser.newPage();
    }
    return this.page;
  }

  /**
   * 获取工具定义
   * @returns 工具定义列表
   */
  static getDefinitions(): Tool[] {
    return [
      {
        name: 'browser_navigate',
        description: '导航到指定网址',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: '目标网址'
            }
          },
          required: ['url']
        }
      },
      {
        name: 'browser_click',
        description: '点击页面元素',
        parameters: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS 选择器'
            },
            text: {
              type: 'string',
              description: '元素文本内容（与selector二选一）'
            }
          },
          required: ['selector']
        }
      },
      {
        name: 'browser_type',
        description: '在输入框中输入文本',
        parameters: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: '输入框 CSS 选择器'
            },
            text: {
              type: 'string',
              description: '要输入的文本'
            },
            clear: {
              type: 'boolean',
              description: '是否先清空输入框，默认true'
            }
          },
          required: ['selector', 'text']
        }
      },
      {
        name: 'browser_get_text',
        description: '获取页面文本内容',
        parameters: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS 选择器，默认获取整个页面文本'
            }
          }
        }
      },
      {
        name: 'browser_screenshot',
        description: '截取浏览器页面并保存到文件',
        parameters: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: '保存路径（可选），默认保存到桌面，文件名格式: browser_screenshot_时间戳.png'
            },
            fullPage: {
              type: 'boolean',
              description: '是否截取整个页面，默认false'
            }
          }
        }
      },
      {
        name: 'browser_scroll',
        description: '滚动页面',
        parameters: {
          type: 'object',
          properties: {
            direction: {
              type: 'string',
              description: '滚动方向: up/down/left/right'
            },
            amount: {
              type: 'number',
              description: '滚动像素数，默认500'
            }
          },
          required: ['direction']
        }
      },
      {
        name: 'browser_go_back',
        description: '返回上一页',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'browser_close',
        description: '关闭浏览器',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  /**
   * 导航到指定网址
   * @param url 目标网址
   * @returns 执行结果
   */
  static async navigate(url: string): Promise<ToolResult> {
    try {
      const page = await this.getPage();
      await page.goto(url, { waitUntil: 'networkidle2' });

      return {
        success: true,
        data: {
          message: `已导航到: ${url}`,
          title: await page.title(),
          url: page.url()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `导航失败: ${error.message}`
      };
    }
  }

  /**
   * 点击页面元素
   * @param selector CSS 选择器
   * @returns 执行结果
   */
  static async click(selector: string): Promise<ToolResult> {
    try {
      const page = await this.getPage();
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector);

      return {
        success: true,
        data: {
          message: `已点击元素: ${selector}`
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `点击失败: ${error.message}`
      };
    }
  }

  /**
   * 在输入框中输入文本
   * @param selector CSS 选择器
   * @param text 要输入的文本
   * @param clear 是否先清空
   * @returns 执行结果
   */
  static async type(selector: string, text: string, clear: boolean = true): Promise<ToolResult> {
    try {
      const page = await this.getPage();
      await page.waitForSelector(selector, { timeout: 5000 });

      if (clear) {
        await page.evaluate((sel: string) => {
          const el = (document as any).querySelector(sel);
          if (el) el.value = '';
        }, selector);
      }

      await page.type(selector, text);

      return {
        success: true,
        data: {
          message: `已在 ${selector} 输入文本`
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `输入失败: ${error.message}`
      };
    }
  }

  /**
   * 获取页面文本内容
   * @param selector CSS 选择器
   * @returns 文本内容
   */
  static async getText(selector?: string): Promise<ToolResult> {
    try {
      const page = await this.getPage();
      let text: string;

      if (selector) {
        await page.waitForSelector(selector, { timeout: 5000 });
        text = await page.$eval(selector, (el: any) => el.textContent);
      } else {
        text = await page.evaluate(() => (document as any).body.innerText);
      }

      return {
        success: true,
        data: {
          text: text?.substring(0, 5000) || '',
          truncated: text && text.length > 5000
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `获取文本失败: ${error.message}`
      };
    }
  }

  /**
   * 截取浏览器页面
   * @param filePath 保存路径（可选）
   * @param fullPage 是否截取整个页面
   * @returns 截图结果
   */
  static async screenshot(filePath?: string, fullPage: boolean = false): Promise<ToolResult> {
    try {
      const page = await this.getPage();
      
      // 确定保存路径
      let savePath: string;
      if (filePath) {
        savePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
      } else {
        const desktopPath = path.join(os.homedir(), 'Desktop');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
        savePath = path.join(desktopPath, `browser_screenshot_${timestamp}.png`);
      }

      // 确保目录存在
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 截图并保存
      await page.screenshot({ 
        path: savePath,
        fullPage
      });

      // 获取文件信息
      const stats = fs.statSync(savePath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);

      return {
        success: true,
        data: {
          message: '浏览器截图已保存',
          filePath: savePath,
          fileSize: `${fileSizeKB} KB`,
          fullPage,
          pageUrl: page.url(),
          pageTitle: await page.title(),
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
   * 滚动页面
   * @param direction 滚动方向
   * @param amount 滚动像素数
   * @returns 执行结果
   */
  static async scroll(direction: string, amount: number = 500): Promise<ToolResult> {
    try {
      const page = await this.getPage();

      let scrollX = 0;
      let scrollY = 0;

      switch (direction.toLowerCase()) {
        case 'up':
          scrollY = -amount;
          break;
        case 'down':
          scrollY = amount;
          break;
        case 'left':
          scrollX = -amount;
          break;
        case 'right':
          scrollX = amount;
          break;
      }

      await page.evaluate((x: number, y: number) => {
        (window as any).scrollBy(x, y);
      }, scrollX, scrollY);

      return {
        success: true,
        data: {
          message: `向${direction}滚动 ${amount} 像素`
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
   * 返回上一页
   * @returns 执行结果
   */
  static async goBack(): Promise<ToolResult> {
    try {
      const page = await this.getPage();
      await page.goBack({ waitUntil: 'networkidle2' });

      return {
        success: true,
        data: {
          message: '已返回上一页',
          url: page.url()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `返回失败: ${error.message}`
      };
    }
  }

  /**
   * 关闭浏览器
   * @returns 执行结果
   */
  static async close(): Promise<ToolResult> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }

      return {
        success: true,
        data: {
          message: '浏览器已关闭'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `关闭浏览器失败: ${error.message}`
      };
    }
  }
}
