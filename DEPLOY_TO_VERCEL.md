# 部署到 Vercel

本指南将帮助你将 AI 远程控制项目的**前端**部署到 Vercel。

## 架构说明

本项目采用前后端分离架构：
- **前端**：部署到 Vercel（在线访问）
- **后端**：在本地运行（控制你的电脑）

前端提供了服务器地址配置功能，可以连接到本地运行的后端服务。

## 前置要求

1. 一个 [Vercel 账号](https://vercel.com/signup)
2. 已将代码推送到 GitHub 仓库

## 部署步骤

### 方法一：通过 Vercel 网站部署（推荐）

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库 `GRinty/ai-remote-control`
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset**: 选择 "Other"
   - **Root Directory**: 保持默认 `./`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待部署完成（通常需要 1-2 分钟）

5. **访问应用**
   - 部署完成后，Vercel 会提供一个 URL（如 `https://your-project.vercel.app`）
   - 点击 URL 访问你的应用

### 方法二：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel
   ```
   
   首次部署时，CLI 会询问一些配置问题：
   - Set up and deploy? → Yes
   - Which scope? → 选择你的账号
   - Link to existing project? → No
   - What's your project's name? → ai-remote-control
   - In which directory is your code located? → ./

4. **生产部署**
   ```bash
   vercel --prod
   ```

## 使用说明

### 1. 在本地运行后端服务

```bash
cd server
npm install
npm run dev
```

后端会在 `http://localhost:3000` 启动。

### 2. 配置前端连接

访问部署好的前端页面，点击右上角的**设置图标**（齿轮），输入后端地址：

- **本地开发**：`http://localhost:3000`
- **使用内网穿透**：输入穿透后的地址（见下文）

### 3. 使用内网穿透（可选）

如果你想从外网访问本地后端，需要使用内网穿透工具：

#### 使用 ngrok

```bash
# 安装 ngrok
# 访问 https://ngrok.com/ 下载并安装

# 启动穿透
ngrok http 3000
```

ngrok 会提供一个公网地址，如 `https://abc123.ngrok.io`，在前端设置中输入这个地址。

#### 使用 frp

```bash
# 需要自己的服务器
# 配置 frpc.ini 后运行
./frpc -c frpc.ini
```

#### 使用 Cloudflare Tunnel

```bash
# 安装 cloudflared
# 运行
cloudflared tunnel --url http://localhost:3000
```

## 工作原理

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Vercel 前端    │ ◄─────► │  本地后端服务    │
│  (在线访问)     │  WebSocket  (控制电脑)   │
│                 │         │                  │
└─────────────────┘         └──────────────────┘
        │                           │
        │                           │
        ▼                           ▼
    用户浏览器                  你的电脑
```

## 注意事项

### ⚠️ 安全提示

1. **不要将后端部署到公网**
   - 后端有完整的系统控制权限
   - 只应在本地或可信网络中运行

2. **使用内网穿透时**
   - 建议添加身份验证
   - 使用 HTTPS 加密连接
   - 不要分享穿透地址给他人

3. **CORS 配置**
   - 后端已配置允许所有来源（`origin: '*'`）
   - 生产环境建议限制为你的 Vercel 域名

### 💡 开发建议

1. **本地开发**
   ```bash
   # 终端 1：运行后端
   cd server && npm run dev
   
   # 终端 2：运行前端
   cd client && npm run dev
   ```

2. **生产使用**
   - 前端：访问 Vercel 部署的地址
   - 后端：在需要控制的电脑上运行

## 自动部署

配置完成后，每次推送到 GitHub 的 `main` 分支，Vercel 会自动重新部署前端。

## 故障排查

### 前端部署失败

1. 检查构建日志
2. 确认 `client/package.json` 中的依赖完整
3. 确认构建命令正确

### 无法连接后端

1. 确认后端服务正在运行
2. 检查防火墙设置
3. 如果使用内网穿透，确认穿透服务正常
4. 检查浏览器控制台的错误信息

### WebSocket 连接失败

1. 确认后端地址正确（包括协议 http:// 或 https://）
2. 检查 CORS 配置
3. 如果使用 HTTPS 前端，后端也需要 HTTPS

## 更多资源

- [Vercel 文档](https://vercel.com/docs)
- [ngrok 文档](https://ngrok.com/docs)
- [Socket.io 文档](https://socket.io/docs/)
