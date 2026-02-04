/**
 * 消息项组件
 */

import React from 'react';
import { User, Bot, Wrench, CheckCircle, XCircle, Brain } from 'lucide-react';
import type { Message, ToolCall, ToolResult } from '../../types';

interface MessageItemProps {
  message: Message;
  toolCall?: ToolCall | null;
  toolResult?: ToolResult | null;
}

/**
 * 格式化时间戳
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * 解析内容，分离思考部分和实际内容
 */
function parseContent(content: string): { thinking: string[]; actualContent: string } {
  const thinking: string[] = [];
  let actualContent = content;

  // 提取思考内容
  const thinkingRegex = /\[思考\](.*?)\[\/思考\]/gs;
  let match;
  while ((match = thinkingRegex.exec(content)) !== null) {
    thinking.push(match[1]);
  }

  // 移除思考标记，保留内容
  actualContent = content.replace(/\[思考\](.*?)\[\/思考\]/gs, '');

  return { thinking, actualContent };
}

/**
 * 消息项组件
 */
export const MessageItem: React.FC<MessageItemProps> = ({ message, toolCall, toolResult }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // 系统消息不显示
  if (isSystem) return null;

  // 解析内容
  const { thinking, actualContent } = parseContent(message.content);

  return (
    <div className={`message-enter flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* 头像 */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isUser ? 'bg-primary-600' : 'bg-slate-700'
          }`}>
            {isUser ? <User size={20} /> : <Bot size={20} />}
          </div>
        </div>

        {/* 消息内容 */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* 思考过程 */}
          {thinking.length > 0 && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-400 text-sm">
              <div className="flex items-center space-x-1 mb-1">
                <Brain size={12} />
                <span className="text-xs font-medium">思考过程</span>
              </div>
              <div className="whitespace-pre-wrap break-words italic">
                {thinking.join('')}
              </div>
            </div>
          )}

          {/* 消息气泡 */}
          <div className={`px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-primary-600 text-white rounded-tr-sm' 
              : 'bg-slate-800 text-slate-100 rounded-tl-sm'
          }`}>
            <div className="whitespace-pre-wrap break-words">
              {actualContent || message.content}
            </div>
          </div>

          {/* 工具调用指示器 */}
          {toolCall && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-slate-400 tool-call-enter">
              <Wrench size={14} />
              <span>正在执行: {toolCall.name}</span>
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* 工具结果 */}
          {toolResult && (
            <div className={`mt-2 flex items-center space-x-2 text-sm tool-call-enter ${
              toolResult.success ? 'text-green-400' : 'text-red-400'
            }`}>
              {toolResult.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
              <span>{toolResult.success ? '执行成功' : '执行失败'}</span>
            </div>
          )}

          {/* 时间戳 */}
          <span className="mt-1 text-xs text-slate-500">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};
