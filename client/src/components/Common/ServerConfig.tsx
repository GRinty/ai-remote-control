/**
 * 服务器配置组件
 */

import React, { useState, useEffect } from 'react';
import { Settings, X, Check, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ServerConfigProps {
  onConnect: (url: string) => void;
  currentUrl: string;
  isConnected: boolean;
}

/**
 * 服务器配置组件
 */
export function ServerConfig({ onConnect, currentUrl, isConnected }: ServerConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState(currentUrl);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setServerUrl(currentUrl);
  }, [currentUrl]);

  /**
   * 处理连接
   */
  const handleConnect = () => {
    setError('');
    
    // 验证 URL
    if (!serverUrl.trim()) {
      setError('请输入服务器地址');
      return;
    }

    try {
      new URL(serverUrl);
    } catch {
      setError('无效的 URL 格式');
      return;
    }

    onConnect(serverUrl);
    setIsOpen(false);
  };

  /**
   * 处理使用默认地址
   */
  const handleUseDefault = () => {
    const defaultUrl = window.location.origin;
    setServerUrl(defaultUrl);
  };

  return (
    <>
      {/* 设置按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
        title="服务器设置"
      >
        <Settings className="w-5 h-5 text-slate-400" />
      </button>

      {/* 配置弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-800">
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white">服务器设置</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 space-y-4">
              {/* 当前状态 */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50">
                {isConnected ? (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-400">已连接</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm text-yellow-400">未连接</span>
                  </>
                )}
              </div>

              {/* 服务器地址输入 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  服务器地址
                </label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>

              {/* 说明 */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-300">
                  💡 提示：如果后端在本地运行，请输入本地地址（如 http://localhost:3000）。
                  如果使用内网穿透，请输入穿透后的地址。
                </p>
              </div>

              {/* 快捷按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={handleUseDefault}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
                >
                  使用当前域名
                </button>
                <button
                  onClick={() => setServerUrl('http://localhost:3000')}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
                >
                  本地开发
                </button>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-6 border-t border-slate-800">
              <Button
                variant="secondary"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleConnect}
                className="flex-1"
              >
                连接
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
