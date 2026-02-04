# AI 远程控制

通过对话形式让 AI 控制你的电脑，支持多种 AI 模型（DeepSeek、OpenAI、Claude、Ollama、MiniMax 等）。

## ✨ 功能特性

- 🤖 **多模型支持**: DeepSeek、OpenAI GPT、Claude、Ollama 本地模型、MiniMax
- 💬 **对话式交互**: 自然语言指令控制电脑
- � **智能多轮调用**: 自动处理复杂的多步骤任务
- �🛠️ **丰富工具集**: 
  - 系统操作（执行命令、进程管理、系统信息）
  - 文件操作（读写文件、目录管理）
  - GUI 控制（鼠标、键盘、截图）
  - 浏览器自动化（网页浏览、表单填写）
- 📱 **移动端兼容**: 响应式设计，支持手机/平板访问
- ⚡ **实时通信**: WebSocket 实时对话，流式响应
- 🔒 **安全机制**: 危险命令拦截，系统目录保护

## 🚀 快速开始

### 前置要求

- Node.js >= 16.0.0
- npm 或 yarn

### 1. 克隆项目

```bash
git clone https://github.com/your-username/ai-remote-control.git
cd ai-remote-control
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 3. 配置环境变量

在 `server` 目录下创建 `.env` 文件：

```env
# 服务器配置
PORT=3000
HOST=0.0.0.0

# AI 配置（以 DeepSeek 为例）
AI_PROVIDER=deepseek
AI_MODEL=deepseek-chat
AI_API_KEY=your-api-key-here
AI_BASE_URL=https://api.deepseek.com/v1
AI_TEMPERATURE=0.7

# 安全配置
REQUIRE_CONFIRMATION=true
MAX_CONCURRENT_TASKS=3
```

### 4. 启动服务

**方式一：使用启动脚本（Windows）**
```powershell
.\start.ps1
```

**方式二：手动启动**
```bash
# 启动后端（在 server 目录）
npm run dev

# 启动前端（在 client 目录，新终端）
npm run dev
```

### 5. 访问应用

打开浏览器访问: http://localhost:5173

## 🔧 AI 模型配置

### DeepSeek（推荐）
```env
AI_PROVIDER=deepseek
AI_MODEL=deepseek-chat
AI_API_KEY=sk-your-key
AI_BASE_URL=https://api.deepseek.com/v1
```

### OpenAI
```env
AI_PROVIDER=openai
AI_MODEL=gpt-4
AI_API_KEY=sk-your-key
```

### Claude
```env
AI_PROVIDER=claude
AI_MODEL=claude-3-sonnet-20240229
AI_API_KEY=sk-your-key
```

### Ollama (本地模型)
```env
AI_PROVIDER=ollama
AI_MODEL=llama2
AI_BASE_URL=http://localhost:11434
```

### MiniMax
```env
AI_PROVIDER=minimax
AI_MODEL=MiniMax-M2.1
AI_API_KEY=your-jwt-token
AI_BASE_URL=https://api.minimaxi.com/anthropic
```

## 📝 使用示例

### 系统操作
- "查看系统信息"
- "列出当前运行的进程"
- "打开 VSCode"
- "执行命令：ping www.baidu.com"

### 文件操作
- "在桌面创建一个 hello.txt 文件，内容是 Hello World"
- "读取桌面上的 readme.txt 文件"
- "列出 D 盘根目录的文件"

### GUI 控制
- "帮我截个图"
- "在屏幕 (100, 100) 的位置点击鼠标"
- "输入文本：Hello World"
- "按下回车键"

### 浏览器操作
- "打开浏览器访问 https://www.baidu.com"
- "在百度输入框中搜索：人工智能"
- "截取浏览器页面"

### 多步骤任务
- "先截图，然后查看系统信息"
- "检查系统信息，如果是 Windows 就打开记事本"

## 🏗️ 项目结构

```
ai-remote-control/
├── server/                 # 后端服务
│   ├── src/
│   │   ├── providers/      # AI 模型适配层
│   │   ├── services/       # 业务服务
│   │   ├── tools/          # 工具实现
│   │   ├── executor/       # 任务执行器
│   │   └── types/          # 类型定义
│   └── package.json
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── hooks/          # 自定义 Hooks
│   │   └── services/       # API 服务
│   └── package.json
├── start.ps1              # Windows 启动脚本
└── README.md
```

## 🔒 安全说明

- ⚠️ 危险命令（如删除系统文件、格式化磁盘等）会被自动拦截
- 🛡️ 系统关键目录（Windows、Program Files 等）受保护
- 🔐 建议在生产环境开启 `REQUIRE_CONFIRMATION=true`
- 🌐 不要在公共网络暴露此服务
- 🔑 定期更换 API Key
- 📁 `.env` 文件已在 `.gitignore` 中，不会上传到 Git

## 🛠️ 技术栈

- **后端**: Node.js + Express + TypeScript + Socket.io
- **前端**: React + TypeScript + Vite + Tailwind CSS
- **AI SDK**: OpenAI SDK、Anthropic SDK
- **自动化**: @nut-tree/nut.js (GUI)、Puppeteer (浏览器)

## 📋 开发计划

- [ ] 语音输入支持
- [ ] 更多 AI 模型支持
- [ ] 任务历史记录
- [ ] 自定义工具扩展
- [ ] 多语言支持
- [ ] Docker 部署支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

## ⚠️ 免责声明

本项目仅供学习和研究使用。使用本项目控制计算机时，请确保：
1. 你有权限操作该计算机
2. 不要用于任何非法用途
3. 注意保护个人隐私和数据安全
4. 使用前请仔细阅读代码，了解其工作原理

作者不对使用本项目造成的任何损失负责。
