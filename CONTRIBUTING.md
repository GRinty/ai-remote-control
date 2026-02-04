# 贡献指南

感谢你考虑为 AI 远程控制项目做出贡献！

## 如何贡献

### 报告 Bug

如果你发现了 bug，请创建一个 Issue，并包含以下信息：

- Bug 的详细描述
- 复现步骤
- 预期行为
- 实际行为
- 系统环境（操作系统、Node.js 版本等）
- 截图（如果适用）

### 提出新功能

如果你有新功能的想法，请创建一个 Issue 并描述：

- 功能的详细说明
- 使用场景
- 可能的实现方案

### 提交代码

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建一个 Pull Request

### 代码规范

- 使用 TypeScript
- 遵循现有的代码风格
- 添加必要的注释
- 确保代码通过 lint 检查
- 测试你的更改

### 提交信息规范

使用清晰的提交信息：

- `feat: 添加新功能`
- `fix: 修复 bug`
- `docs: 更新文档`
- `style: 代码格式调整`
- `refactor: 代码重构`
- `test: 添加测试`
- `chore: 构建/工具链更新`

## 开发环境设置

1. 克隆仓库
```bash
git clone https://github.com/your-username/ai-remote-control.git
cd ai-remote-control
```

2. 安装依赖
```bash
cd server && npm install
cd ../client && npm install
```

3. 配置环境变量
```bash
cp server/.env.example server/.env
# 编辑 .env 文件，填入你的 API key
```

4. 启动开发服务器
```bash
# 终端 1
cd server && npm run dev

# 终端 2
cd client && npm run dev
```

## 项目结构

```
ai-remote-control/
├── server/           # 后端服务
│   ├── src/
│   │   ├── providers/  # AI 提供者
│   │   ├── services/   # 业务逻辑
│   │   ├── tools/      # 工具实现
│   │   └── types/      # 类型定义
│   └── package.json
├── client/           # 前端应用
│   ├── src/
│   │   ├── components/ # React 组件
│   │   ├── hooks/      # 自定义 Hooks
│   │   └── services/   # API 服务
│   └── package.json
└── README.md
```

## 添加新的 AI 提供者

1. 在 `server/src/providers/` 创建新文件
2. 实现 `IAIProvider` 接口
3. 在 `server/src/providers/index.ts` 注册
4. 更新文档

## 添加新工具

1. 在 `server/src/tools/` 创建新文件
2. 实现工具类和 `getDefinitions()` 方法
3. 在 `server/src/tools/index.ts` 注册
4. 更新文档

## 问题和讨论

如有任何问题，欢迎在 Issues 中讨论！

## 行为准则

请保持友好和尊重，我们致力于营造一个开放和包容的社区环境。
