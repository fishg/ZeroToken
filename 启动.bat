@echo off
chcp 65001 >nul 2>&1
title Zero-Token Gateway

:: 查找 OpenClaw
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
    echo  [x] 未找到 OpenClaw，请先运行「一键安装.bat」
    pause
    exit /b 1
)

:: 清理可能残留的旧网关进程
echo  正在检查端口占用...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":18789 " ^| findstr "LISTENING"') do (
    if not "%%a"=="0" (
        echo  发现残留进程 PID=%%a，正在清理...
        taskkill /PID %%a /T /F >nul 2>&1
        ping -n 3 127.0.0.1 >nul 2>&1
    )
)

echo.
echo  正在启动 Gateway...
echo  启动后会自动打开浏览器
echo  关闭此窗口即可停止服务
echo.

:: 立即打开等待页面（页面内部轮询网关，就绪后自动跳转）
start "" "%~dp0gateway-wait.html"

:: 前台运行 gateway（关窗口即停止）
call "%OPENCLAW_CMD%" gateway run

:: 如果 gateway 异常退出，显示错误提示
if %errorlevel% neq 0 (
    echo.
    echo  ╔══════════════════════════════════════╗
    echo  ║  [x] 网关启动失败                    ║
    echo  ║                                      ║
    echo  ║  可能原因:                            ║
    echo  ║  1. 端口 18789 被其他程序占用         ║
    echo  ║  2. OpenClaw 配置文件损坏             ║
    echo  ║  3. 插件未正确安装                    ║
    echo  ║                                      ║
    echo  ║  请尝试重新运行「一键安装.bat」        ║
    echo  ╚══════════════════════════════════════╝
    echo.
    pause
)
