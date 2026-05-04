<#
.SYNOPSIS
    Zero-Token 插件一键安装脚本
.DESCRIPTION
    自动构建、部署 Zero-Token 插件到 OpenClaw。
    需要在 PowerShell 中以普通用户权限运行即可。
.USAGE
    在 ZeroToken 项目根目录下运行:
    powershell -ExecutionPolicy Bypass -File install.ps1
#>

$ErrorActionPreference = "Stop"

# ── 颜色输出 ──
function Write-Step  ($msg) { Write-Host "[*] $msg" -ForegroundColor Cyan }
function Write-OK    ($msg) { Write-Host "[√] $msg" -ForegroundColor Green }
function Write-Warn  ($msg) { Write-Host "[!] $msg" -ForegroundColor Yellow }
function Write-Fail  ($msg) { Write-Host "[x] $msg" -ForegroundColor Red }

# ── 路径定义 ──
$ProjectDir   = $PSScriptRoot
$ExtDir       = Join-Path $env:USERPROFILE ".openclaw\extensions\zero-token"
$ExtDistDir   = Join-Path $ExtDir "dist"

Write-Host ""
Write-Host "============================================" -ForegroundColor White
Write-Host "   Zero-Token 插件安装器" -ForegroundColor White
Write-Host "============================================" -ForegroundColor White
Write-Host ""
Write-Host "  项目目录:    $ProjectDir"
Write-Host "  插件目录:    $ExtDir"
Write-Host ""

# ── Step 1: 安装依赖 ──
Write-Step "安装项目依赖 (npm install)..."
Push-Location $ProjectDir
try {
    & npm install --silent 2>&1 | Out-Null
    Write-OK "依赖安装完成"
} catch {
    Write-Fail "npm install 失败: $_"
    Pop-Location
    exit 1
}
Pop-Location

# ── Step 2: 构建 ──
Write-Step "构建插件 (node build.mjs)..."
Push-Location $ProjectDir
try {
    & node build.mjs 2>&1
    if ($LASTEXITCODE -ne 0) { throw "build failed" }
    Write-OK "构建完成"
} catch {
    Write-Fail "构建失败: $_"
    Pop-Location
    exit 1
}
Pop-Location

# ── Step 3: 部署到 extensions ──
Write-Step "部署插件到 $ExtDir ..."

# 创建目录
if (-not (Test-Path $ExtDistDir)) {
    New-Item -ItemType Directory -Path $ExtDistDir -Force | Out-Null
}

# 复制文件
Copy-Item (Join-Path $ProjectDir "dist\index.js")          $ExtDistDir -Force
Copy-Item (Join-Path $ProjectDir "package.json")            $ExtDir     -Force
Copy-Item (Join-Path $ProjectDir "openclaw.plugin.json")    $ExtDir     -Force

Write-OK "插件文件已部署"

# ── Step 4: 安装插件运行时依赖 ──
Write-Step "安装插件运行时依赖..."
Push-Location $ExtDir
try {
    & npm install --omit=dev --silent 2>&1 | Out-Null
    Write-OK "插件依赖安装完成"
} catch {
    Write-Warn "插件依赖安装失败 (可能不影响): $_"
}
Pop-Location

# ── 完成 ──
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   安装完成!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  下一步:" -ForegroundColor White
Write-Host "  1. 关闭正在运行的 gateway (如有)" -ForegroundColor White
Write-Host "  2. 启动 gateway:" -ForegroundColor White
Write-Host '     & openclaw gateway run' -ForegroundColor Yellow
Write-Host "  3. 打开 http://127.0.0.1:18789/ 使用" -ForegroundColor White
Write-Host ""
Write-Host "  首次使用需要登录 Web 服务 (如 DeepSeek):" -ForegroundColor White
Write-Host '     openclaw login' -ForegroundColor Yellow
Write-Host "  选择 Zero Token → DeepSeek (Web) → Browser Login" -ForegroundColor White
Write-Host ""
