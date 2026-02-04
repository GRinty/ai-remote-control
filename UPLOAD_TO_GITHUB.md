# 上传到 GitHub 指南

## 步骤 1: 初始化 Git 仓库

在项目根目录执行：

```bash
git init
git add .
git commit -m "Initial commit: AI Remote Control Project"
```

## 步骤 2: 在 GitHub 创建仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - Repository name: `ai-remote-control`
   - Description: `通过对话形式让 AI 控制你的电脑`
   - 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"
3. 点击 "Create repository"

## 步骤 3: 关联远程仓库

将 GitHub 上的仓库地址替换到下面的命令中：

```bash
git remote add origin https://github.com/your-username/ai-remote-control.git
git branch -M main
git push -u origin main
```

## 步骤 4: 验证上传

访问你的 GitHub 仓库页面，确认文件已上传成功。

## 重要提示

### ✅ 已处理的安全事项

- `.env` 文件已在 `.gitignore` 中，不会上传
- API Key 已从 `.env` 文件中移除
- `.env.example` 提供了配置模板

### ⚠️ 上传前检查清单

- [ ] 确认 `.env` 文件不在 Git 追踪中
- [ ] 确认没有其他敏感信息（密码、token 等）
- [ ] 确认 `node_modules/` 不在 Git 追踪中
- [ ] 确认 `dist/` 和 `build/` 不在 Git 追踪中

### 📝 后续步骤

1. **添加 GitHub Topics**
   - 在仓库页面点击设置图标
   - 添加相关标签：`ai`, `automation`, `typescript`, `react`, `nodejs`

2. **设置 GitHub Actions**
   - CI/CD 配置已在 `.github/workflows/ci.yml`
   - 推送代码后会自动运行

3. **添加 README 徽章**
   - Build Status
   - License
   - Node Version

4. **创建 Release**
   - 打标签：`git tag v1.0.0`
   - 推送标签：`git push origin v1.0.0`
   - 在 GitHub 创建 Release

## 常见问题

### Q: 如何更新远程仓库？

```bash
git add .
git commit -m "描述你的更改"
git push
```

### Q: 如何撤销已提交但未推送的更改？

```bash
git reset --soft HEAD~1
```

### Q: 如何查看 Git 状态？

```bash
git status
```

### Q: 如何查看提交历史？

```bash
git log --oneline
```

## 需要帮助？

如果遇到问题，可以：
1. 查看 [GitHub 文档](https://docs.github.com/)
2. 在项目中创建 Issue
3. 搜索相关错误信息
