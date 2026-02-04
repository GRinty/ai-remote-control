/**
 * 消息列表组件
 */

import React, { useRef, useEffect } from 'react';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from '../Common/Loading';
import type { Message, ToolCall, ToolResult } from '../../types';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  currentToolCall: ToolCall | null;
  toolResult: ToolResult | null;
}

/**
 * 消息列表组件
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming,
  streamingContent,
  currentToolCall,
  toolResult
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.length === 0 && !isStreaming ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <div className="w-16 h-16 mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-lg font-medium">开始对话</p>
          <p className="text-sm mt-2">发送消息让 AI 帮你控制电脑</p>
          <div className="mt-6 grid grid-cols-1 gap-2 text-sm">
            <p className="text-slate-400">你可以尝试：</p>
            <div className="space-y-1 text-slate-500">
              <p>• "打开记事本"</p>
              <p>• "截图"</p>
              <p>• "查看系统信息"</p>
              <p>• "打开浏览器访问百度"</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageItem 
              key={message.id} 
              message={message}
              toolCall={index === messages.length - 1 ? currentToolCall : null}
              toolResult={index === messages.length - 1 ? toolResult : null}
            />
          ))}

          {/* 流式响应内容 */}
          {isStreaming && streamingContent && (
            <MessageItem
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingContent,
                timestamp: Date.now(),
                isStreaming: true
              }}
              toolCall={currentToolCall}
            />
          )}

          {/* 正在输入指示器 */}
          {isStreaming && !streamingContent && (
            <div className="flex justify-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <TypingIndicator />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
