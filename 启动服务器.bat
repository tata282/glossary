@echo off
chcp 65001 >nul
title 物流关务术语库 - 服务器
echo ========================================
echo   物流关务术语库 - 启动服务器
echo ========================================
echo.

REM 使用内嵌 Python
set PYTHON=%~dp0server\python\python.exe

if not exist "%PYTHON%" (
    echo [错误] 未找到 Python，请确认 server\python\ 目录存在
    pause
    exit /b 1
)

echo [信息] 正在启动服务器...
echo.
"%PYTHON%" "%~dp0server\server.py"

pause