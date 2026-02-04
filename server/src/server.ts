/**
 * Express 服务器和 Socket.io 配置
 */

import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { getConfig } from './config';
import { chatService } from './services/chat.service';
import { taskExecutor } from './executor/task.executor';
import { SocketEvents } from './types';

/**
 * 创建并配置服务器
 */
export function createServer() {
  const app = express();
  const server = createHttpServer(app);
  const config = getConfig();

  // 配置 CORS
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
  }));

  // 解析 JSON
  app.use(express.json());

  // 静态文件服务
  app.use(express.static(path.join(__dirname, '../../client/dist')));

  // 配置 Socket.io
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // 设置任务执行器回调
  taskExecutor.setCallbacks({
    onTaskUpdate: (task) => {
      io.emit(SocketEvents.TASK_UPDATE, task);
    },
    onToolCall: (toolCall) => {
      io.emit(SocketEvents.TOOL_CALL, toolCall);
    },
    onToolResult: (result) => {
      io.emit(SocketEvents.TOOL_RESULT, result);
    }
  });

  // Socket.io 连接处理
  io.on('connection', (socket) => {
    console.log('客户端已连接:', socket.id);

    // 发送连接成功消息
    socket.emit(SocketEvents.CONNECTED, {
      message: '连接成功',
      socketId: socket.id
    });

    // 处理聊天消息（流式）
    socket.on(SocketEvents.MESSAGE, async (data) => {
      const { sessionId, content } = data;

      try {
        // 开始流式响应
        socket.emit(SocketEvents.STREAM_START, { sessionId });

        await chatService.processMessageStream(sessionId, content, {
          onChunk: (chunk) => {
            socket.emit(SocketEvents.STREAM_CHUNK, {
              sessionId,
              ...chunk
            });
          },
          onToolCall: (toolCall) => {
            socket.emit(SocketEvents.TOOL_CALL, {
              sessionId,
              toolCall
            });
          },
          onToolResult: (result) => {
            socket.emit(SocketEvents.TOOL_RESULT, {
              sessionId,
              result
            });
          },
          onComplete: () => {
            const messages = chatService.getMessages(sessionId);
            socket.emit(SocketEvents.STREAM_END, { sessionId, messages });
          },
          onError: (error) => {
            socket.emit(SocketEvents.ERROR, {
              sessionId,
              error: error.message
            });
          }
        });
      } catch (error: any) {
        socket.emit(SocketEvents.ERROR, {
          sessionId,
          error: error.message
        });
      }
    });

    // 创建新会话
    socket.on('create_session', () => {
      const session = chatService.createSession();
      socket.emit('session_created', session);
    });

    // 获取会话列表
    socket.on('get_sessions', () => {
      const sessions = chatService.getAllSessions();
      socket.emit('sessions_list', sessions);
    });

    // 获取会话消息
    socket.on('get_messages', (data) => {
      const { sessionId } = data;
      const messages = chatService.getMessages(sessionId);
      socket.emit('messages_list', { sessionId, messages });
    });

    // 清空会话
    socket.on('clear_session', (data) => {
      const { sessionId } = data;
      chatService.clearMessages(sessionId);
      socket.emit('session_cleared', { sessionId });
    });

    // 删除会话
    socket.on('delete_session', (data) => {
      const { sessionId } = data;
      chatService.deleteSession(sessionId);
      socket.emit('session_deleted', { sessionId });
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log('客户端已断开:', socket.id);
    });
  });

  // REST API 路由
  
  // 健康检查
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      provider: config.ai.provider,
      model: config.ai.model
    });
  });

  // 获取配置信息
  app.get('/api/config', (req, res) => {
    res.json({
      provider: config.ai.provider,
      model: config.ai.model,
      server: {
        port: config.server.port,
        host: config.server.host
      }
    });
  });

  // 获取可用工具列表
  app.get('/api/tools', (req, res) => {
    const { toolRegistry } = require('./tools');
    const tools = toolRegistry.getAllDefinitions();
    res.json({ tools });
  });

  // 创建会话
  app.post('/api/sessions', (req, res) => {
    const session = chatService.createSession();
    res.json(session);
  });

  // 获取所有会话
  app.get('/api/sessions', (req, res) => {
    const sessions = chatService.getAllSessions();
    res.json({ sessions });
  });

  // 获取特定会话
  app.get('/api/sessions/:id', (req, res) => {
    const session = chatService.getSession(req.params.id);
    if (session) {
      res.json(session);
    } else {
      res.status(404).json({ error: '会话不存在' });
    }
  });

  // 删除会话
  app.delete('/api/sessions/:id', (req, res) => {
    const success = chatService.deleteSession(req.params.id);
    res.json({ success });
  });

  // 发送消息（非流式）
  app.post('/api/chat', async (req, res) => {
    const { sessionId, content } = req.body;

    try {
      const result = await chatService.processMessage(sessionId, content);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 获取会话消息
  app.get('/api/sessions/:id/messages', (req, res) => {
    const messages = chatService.getMessages(req.params.id);
    res.json({ messages });
  });

  // 所有其他路由返回前端应用
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });

  return { app, server, io };
}

/**
 * 启动服务器
 */
export function startServer() {
  const { server } = createServer();
  const config = getConfig();

  server.listen(config.server.port, config.server.host, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║     AI 远程控制服务器已启动                            ║
║                                                        ║
║  📡 服务器地址: http://${config.server.host}:${config.server.port}              ║
║  🤖 AI 提供商: ${config.ai.provider.padEnd(20)} ║
║  🧠 模型: ${config.ai.model.padEnd(27)} ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);
  });

  return server;
}
