/**
 * 主应用组件
 */

import React, { useState } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { MessageList } from './components/Chat/MessageList';
import { ChatInput } from './components/Chat/ChatInput';
import { useSocket } from './hooks/useSocket';
import { useChat } from './hooks/useChat';
import { useMobile } from './hooks/useMobile';

/**
 * 主应用组件
 */
function App() {
  const { isConnected, status } = useSocket();
  const {
    sessions,
    currentSessionId,
    messages,
    isStreaming,
    streamingContent,
    currentToolCall,
    toolResult,
    createSession,
    selectSession,
    deleteSession,
    sendMessage
  } = useChat();
  const { isMobile } = useMobile();

  // 侧边栏状态（移动端）
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /**
   * 处理发送消息
   */
  const handleSendMessage = async (content: string) => {
    if (!isConnected) {
      alert('未连接到服务器，请检查网络连接');
      return;
    }
    await sendMessage(content);
  };

  /**
   * 处理创建新会话
   */
  const handleCreateSession = async () => {
    await createSession();
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  /**
   * 处理选择会话
   */
  const handleSelectSession = (sessionId: string) => {
    selectSession(sessionId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* 侧边栏 */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onDeleteSession={deleteSession}
        onClose={() => setIsSidebarOpen(false)}
        isOpen={isSidebarOpen}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 头部 */}
        <Header
          connectionStatus={status}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* 消息列表 */}
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          currentToolCall={currentToolCall}
          toolResult={toolResult}
        />

        {/* 输入框 */}
        <ChatInput
          onSend={handleSendMessage}
          isStreaming={isStreaming}
          placeholder={isConnected ? '输入消息让 AI 帮你控制电脑...' : '等待连接服务器...'}
        />
      </div>
    </div>
  );
}

export default App;
