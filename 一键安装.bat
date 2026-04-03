@echo off
chcp 65001 >nul 2>&1
title Zero-Token 一键安装
color 0A

echo.
echo  ╔══════════════════════════════════════╗
echo  ║     Zero-Token 一键安装程序          ║
echo  ║     免 API Key，用浏览器登录 AI      ║
echo  ╚══════════════════════════════════════╝
echo.

:: ── 检查 Node.js ──
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [x] 未检测到 Node.js，请先安装 Node.js 22+
    echo      下载地址: https://nodejs.org/
    pause
    exit /b 1
)
:: ── 检查 Node.js 版本 ──
for /f "tokens=1 delims=." %%V in ('node -v 2^>nul') do set "NODE_VER=%%V"
set "NODE_VER=%NODE_VER:v=%"
if %NODE_VER% LSS 22 (
    color 0C
    echo  [x] Node.js 版本过低（需要 22+，当前 v%NODE_VER%）
    echo      请升级: https://nodejs.org/
    pause
    exit /b 1
)
echo  [√] Node.js v%NODE_VER%

:: ── 检查 OpenClaw ──
set "OPENCLAW_CMD="
if exist "%LOCALAPPDATA%\.clawhub123\bin\openclaw.cmd" (
    set "OPENCLAW_CMD=%LOCALAPPDATA%\.clawhub123\bin\openclaw.cmd"
)
if "%OPENCLAW_CMD%"=="" (
    for /d %%D in ("%LOCALAPPDATA%\.clawhub*") do (
        if exist "%%D\bin\openclaw.cmd" set "OPENCLAW_CMD=%%D\bin\openclaw.cmd"
    )
)
if "%OPENCLAW_CMD%"=="" (
    color 0C
    echo  [x] 未检测到 OpenClaw，请先安装 OpenClaw
    echo      安装命令: npm install -g openclaw
    pause
    exit /b 1
)
echo  [√] OpenClaw: %OPENCLAW_CMD%

:: ── Step 1: 安装依赖 ──
echo.
echo  [1/5] 安装项目依赖...
cd /d "%~dp0"
call npm install 2>&1 | findstr /I "ERR!"
if exist "node_modules" (
    echo  [√] 依赖安装完成
) else (
    color 0C
    echo  [x] 依赖安装失败，请检查网络连接
    echo      可尝试手动运行: npm install
    pause
    exit /b 1
)

:: ── Step 2: 构建 ──
echo  [2/5] 构建插件...
call node build.mjs 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [x] 构建失败
    pause
    exit /b 1
)
echo  [√] 构建完成

:: ── Step 3: 部署 ──
echo  [3/5] 部署插件...
set "EXT_DIR=%USERPROFILE%\.openclaw\extensions\zero-token"
if not exist "%EXT_DIR%\dist" mkdir "%EXT_DIR%\dist"
copy /Y "dist\index.js" "%EXT_DIR%\dist\" >nul
copy /Y "package.json" "%EXT_DIR%\" >nul
copy /Y "openclaw.plugin.json" "%EXT_DIR%\" >nul
echo  [√] 插件已部署

:: ── Step 4: 安装插件运行时依赖 ──
echo  [4/5] 安装插件运行时依赖...
cd /d "%EXT_DIR%"
call npm install --omit=dev 2>&1 | findstr /I "ERR!"
if exist "node_modules" (
    echo  [√] 插件依赖安装完成
) else (
    color 0C
    echo  [x] 插件依赖安装失败，请检查网络连接
    pause
    exit /b 1
)

:: ── Step 5: 打补丁 ──
echo  [5/5] 打补丁 (globalThis registry)...
cd /d "%~dp0"
call node patch-registry.js
if %errorlevel% neq 0 (
    color 0C
    echo  [x] 补丁失败，请检查 OpenClaw 安装
    pause
    exit /b 1
)

:: ── 完成 ──
echo.
color 0A
echo  ╔══════════════════════════════════════╗
echo  ║         安装完成!                    ║
echo  ╚══════════════════════════════════════╝
echo.
echo  接下来你可以:
echo    - 双击「启动.bat」启动服务 + 打开网页
echo    - 双击「登录.bat」添加新的 AI 账号
echo.
pause
