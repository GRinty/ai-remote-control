/**
 * 侧边栏组件
 */

import React from 'react';
import { Plus, Trash2, MessageSquare, X } from 'lucide-react';
import type { ChatSession } from '../../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onClose?: () => void;
  isOpen: boolean;
}

/**
 * 格式化日期
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 今天
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 昨天
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (date.getDate() === yesterday.getDate()) {
    return '昨天';
  }
  
  // 更早
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

/**
 * 获取会话标题
 */
function getSessionTitle(session: ChatSession): string {
  if (session.title) return session.title;
  
  // 从第一条用户消息生成标题
  const firstUserMessage = session.messages.find(m => m.role === 'user');
  if (firstUserMessage) {
    const title = firstUserMessage.content.slice(0, 20);
    return title + (firstUserMessage.content.length > 20 ? '...' : '');
  }
  
  return '新对话';
}

/**
 * 侧边栏组件
 */
export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onClose,
  isOpen
}) => {
  return (
    <>
      {/* 遮罩层（移动端） */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏 */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-slate-900 border-r border-slate-800
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">对话历史</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onCreateSession}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
              title="新建对话"
            >
              <Plus size={20} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors lg:hidden"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
              <p>暂无对话</p>
              <p className="text-sm mt-1">点击 + 创建新对话</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`
                  group flex items-center gap-3 p-3 rounded-lg cursor-pointer
                  transition-colors
                  ${currentSessionId === session.id 
                    ? 'bg-primary-600/20 border border-primary-600/50' 
                    : 'hover:bg-slate-800 border border-transparent'
                  }
                `}
              >
                <MessageSquare 
                  size={18} 
                  className={currentSessionId === session.id ? 'text-primary-400' : 'text-slate-500'} 
                />
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    currentSessionId === session.id ? 'text-slate-100' : 'text-slate-300'
                  }`}>
                    {getSessionTitle(session)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(session.updatedAt)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-600/20 hover:text-red-400 rounded transition-all"
                  title="删除对话"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* 底部信息 */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <p>AI 远程控制 v1.0</p>
        </div>
      </aside>
    </>
  );
};
