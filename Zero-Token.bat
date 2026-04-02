@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Zero-Token.ps1"
if %errorlevel% neq 0 (
    echo Error occurred
    pause
)
