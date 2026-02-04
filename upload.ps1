# GitHub 上传脚本

Write-Host "
╔════════════════════════════════════════════════════════╗
║                                                        ║
║     AI 远程控制 - GitHub 上传助手                      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

# 检查是否已配置远程仓库
$remoteUrl = git remote get-url origin 2>$null

if ($remoteUrl) {
    Write-Host "已配置远程仓库: $remoteUrl" -ForegroundColor Green
    
    $confirm = Read-Host "是否要推送到此仓库? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "已取消" -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "请输入你的 GitHub 仓库地址 (例如: https://github.com/username/ai-remote-control.git)" -ForegroundColor Yellow
    $repoUrl = Read-Host "仓库地址"
    
    if (-not $repoUrl) {
        Write-Host "错误: 仓库地址不能为空" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "正在添加远程仓库..." -ForegroundColor Yellow
    git remote add origin $repoUrl
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "添加远程仓库失败" -ForegroundColor Red
        exit 1
    }
}

# 检查当前分支
$currentBranch = git branch --show-current

if (-not $currentBranch) {
    Write-Host "正在创建 main 分支..." -ForegroundColor Yellow
    git branch -M main
    $currentBranch = "main"
}

Write-Host "当前分支: $currentBranch" -ForegroundColor Green

# 推送到 GitHub
Write-Host "`n正在推送到 GitHub..." -ForegroundColor Yellow
git push -u origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "
╔════════════════════════════════════════════════════════╗
║                                                        ║
║  ✓ 成功上传到 GitHub!                                  ║
║                                                        ║
║  你可以访问你的仓库查看代码                            ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    " -ForegroundColor Green
} else {
    Write-Host "
╔════════════════════════════════════════════════════════╗
║                                                        ║
║  ✗ 推送失败                                            ║
║                                                        ║
║  可能的原因:                                           ║
║  1. 网络连接问题                                       ║
║  2. 没有权限访问该仓库                                 ║
║  3. 仓库地址错误                                       ║
║                                                        ║
║  请检查错误信息并重试                                  ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    " -ForegroundColor Red
    exit 1
}

Write-Host "`n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
