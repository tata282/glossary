@echo off
chcp 65001 >nul
title 推送术语库到 GitHub

set "PATH=C:\Users\xuduoduo.6\AppData\Local\Programs\Git\cmd;%PATH%"

echo ========================================
echo   推送术语库代码到 GitHub
echo ========================================
echo.
echo 请先在 GitHub 创建仓库，然后执行以下命令：
echo.
echo   git remote add origin https://github.com/你的用户名/glossary.git
echo   git branch -M main
echo   git push -u origin main
echo.
echo 把 "你的用户名" 替换成你的 GitHub 用户名
echo.

cd /d "%~dp0"
git remote -v

pause