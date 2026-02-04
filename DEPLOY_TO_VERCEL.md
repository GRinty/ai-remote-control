# 部署到 Vercel

本指南将帮助你将 AI 远程控制项目部署到 Vercel。

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
   - **Install Command**: `npm install`

4. **配置环境变量**
   
   在 "Environment Variables" 部分添加以下变量：
   
   ```
   AI_PROVIDER=deepseek
   AI_API_KEY=你的API密钥
   AI_MODEL=deepseek-chat
   AI_BASE_URL=https://api.deepseek.com
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=production
   ```
   
   根据你使用的 AI 提供商调整这些值。

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待部署完成（通常需要 2-3 分钟）

6. **访问应用**
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
   
4. **配置环境变量**
   ```bash
   vercel env add AI_PROVIDER
   vercel env add AI_API_KEY
   vercel env add AI_MODEL
   vercel env add AI_BASE_URL
   ```

5. **生产部署**
   ```bash
   vercel --prod
   ```

## 重要说明

### ⚠️ 限制

由于 Vercel 的 Serverless 函数限制，以下功能可能无法正常工作：

1. **系统控制功能**（鼠标、键盘、截图等）
   - Vercel 的 Serverless 环境无法访问本地系统
   - 这些功能需要在本地运行

2. **浏览器自动化**（Puppeteer）
   - Vercel 对 Puppeteer 的支持有限
   - 可能需要使用 `puppeteer-core` 和 Chrome AWS Lambda

3. **WebSocket 连接**
   - Vercel 对 WebSocket 的支持有限
   - 可能需要使用 Vercel 的 Edge Functions 或其他实时通信方案

### 💡 建议的部署方案

对于完整功能，建议使用以下部署方案：

1. **前端**: 部署到 Vercel
2. **后端**: 部署到支持长连接的平台
   - Railway
   - Render
   - Fly.io
   - 自己的 VPS

### 🔧 仅部署前端到 Vercel

如果只想部署前端，后端在本地运行：

1. 修改 `client/src/services/socket.service.ts` 中的 API 地址
2. 在 Vercel 中只部署 `client` 目录
3. 本地运行后端服务器

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `AI_PROVIDER` | AI 提供商 | `deepseek`, `openai`, `claude`, `ollama`, `minimax` |
| `AI_API_KEY` | API 密钥 | `sk-xxx` |
| `AI_MODEL` | 模型名称 | `deepseek-chat`, `gpt-4`, `claude-3-opus` |
| `AI_BASE_URL` | API 基础 URL | `https://api.deepseek.com` |
| `PORT` | 服务器端口 | `3000` |
| `HOST` | 服务器主机 | `0.0.0.0` |

## 自动部署

配置完成后，每次推送到 GitHub 的 `main` 分支，Vercel 会自动触发部署。

## 故障排查

### 部署失败

1. 检查构建日志
2. 确认所有依赖都在 `package.json` 中
3. 确认环境变量配置正确

### 应用无法访问

1. 检查 Vercel 控制台的部署状态
2. 查看 Function Logs
3. 确认环境变量已正确设置

### WebSocket 连接失败

1. Vercel 的 Serverless 函数不支持持久 WebSocket
2. 考虑使用 Vercel Edge Functions 或其他平台

## 更多资源

- [Vercel 文档](https://vercel.com/docs)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)
