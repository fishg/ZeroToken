@echo off
chcp 65001 >nul 2>&1
title Zero-Token 登录

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

echo.
echo  ╔══════════════════════════════════════╗
echo  ║     添加 AI 账号                     ║
echo  ║     选择一个服务，浏览器会自动弹出    ║
echo  ║     登录/扫码后自动保存              ║
echo  ╚══════════════════════════════════════╝
echo.
echo  支持的 AI 服务:
echo    DeepSeek    (chat.deepseek.com)
echo    千问 Qwen   (chat.qwen.ai)
echo    千问国内    (chat2.qianwen.com)
echo    豆包 Doubao (www.doubao.com)
echo    ChatGPT     (chatgpt.com)
echo    Claude      (claude.ai)
echo    Gemini      (gemini.google.com)
echo    Grok        (grok.com)
echo    Kimi        (www.kimi.com)
echo    Perplexity  (www.perplexity.ai)
echo.

call "%OPENCLAW_CMD%" login
pause
