# AI 远程控制启动脚本

Write-Host "
╔════════════════════════════════════════════════════════╗
║                                                        ║
║     AI 远程控制启动器                                  ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

# 检查 Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "错误: 未检测到 Node.js，请先安装 Node.js 18+" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green

# 安装后端依赖
Write-Host "`n[1/4] 正在安装后端依赖..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\server"
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "后端依赖安装失败" -ForegroundColor Red
    exit 1
}

# 安装前端依赖
Write-Host "`n[2/4] 正在安装前端依赖..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\client"
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "前端依赖安装失败" -ForegroundColor Red
    exit 1
}

# 构建前端
Write-Host "`n[3/4] 正在构建前端..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "前端构建失败" -ForegroundColor Red
    exit 1
}

# 启动后端
Write-Host "`n[4/4] 正在启动服务..." -ForegroundColor Yellow

# 在新窗口启动后端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\server'; npm run dev" -WindowStyle Normal

# 等待后端启动
Write-Host "等待后端服务启动..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# 在新窗口启动前端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\client'; npm run dev" -WindowStyle Normal

Write-Host "
╔════════════════════════════════════════════════════════╗
║                                                        ║
║  服务已启动！                                          ║
║                                                        ║
║  📱 前端地址: http://localhost:5173                   ║
║  🔌 后端地址: http://localhost:3000                   ║
║                                                        ║
║  请打开浏览器访问前端地址                              ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
" -ForegroundColor Green

Write-Host "按任意键退出此窗口（服务将继续运行）..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
