/**
 * 头部组件
 */

import React from 'react';
import { Menu, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import type { ConnectionStatus } from '../../types';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  onMenuClick: () => void;
  title?: string;
}

/**
 * 头部组件
 */
export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  onMenuClick,
  title = 'AI 远程控制'
}) => {
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi size={18} className="text-green-400" />;
      case 'connecting':
        return <Wifi size={18} className="text-yellow-400 animate-pulse" />;
      case 'disconnected':
        return <WifiOff size={18} className="text-red-400" />;
      case 'error':
        return <AlertCircle size={18} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '已连接';
      case 'connecting':
        return '连接中...';
      case 'disconnected':
        return '已断开';
      case 'error':
        return '连接错误';
      default:
        return '';
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-100 hidden sm:block">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        {getStatusIcon()}
        <span className={`hidden sm:inline ${
          connectionStatus === 'connected' ? 'text-green-400' :
          connectionStatus === 'connecting' ? 'text-yellow-400' :
          'text-red-400'
        }`}>
          {getStatusText()}
        </span>
      </div>
    </>
  );
};
