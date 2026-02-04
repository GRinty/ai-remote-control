/**
 * 聊天输入组件
 */

import React, { useState, useRef, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  placeholder?: string;
}

/**
 * 快捷指令
 */
const QUICK_ACTIONS = [
  { label: '截图', command: '帮我截个图' },
  { label: '系统信息', command: '查看系统信息' },
  { label: '打开记事本', command: '打开记事本' },
  { label: '打开计算器', command: '打开计算器' }
];

/**
 * 聊天输入组件
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isStreaming,
  placeholder = '输入消息...'
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * 发送消息
   */
  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    
    onSend(input.trim());
    setInput('');
    
    // 重置文本框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isStreaming, onSend]);

  /**
   * 处理键盘事件
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  /**
   * 处理输入变化
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // 自动调整高度
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  /**
   * 使用快捷指令
   */
  const useQuickAction = useCallback((command: string) => {
    onSend(command);
  }, [onSend]);

  return (
    <div className="border-t border-slate-800 bg-slate-900/50 p-4">
      {/* 快捷指令 */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => useQuickAction(action.command)}
            disabled={isStreaming}
            className="flex-shrink-0 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* 输入框 */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isStreaming}
            rows={1}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:border-primary-500 disabled:opacity-50"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="flex-shrink-0 p-3 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl transition-colors"
        >
          {isStreaming ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>

      {/* 提示文字 */}
      <p className="mt-2 text-xs text-slate-500 text-center">
        按 Enter 发送，Shift + Enter 换行
      </p>
    </div>
  );
};
