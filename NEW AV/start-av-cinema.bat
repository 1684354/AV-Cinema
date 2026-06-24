@echo off
cd /d "C:\Users\Administrator\Desktop\CLADUE\NEW AV"
echo [AV Cinema] 正在启动...
echo.
echo 如果 dev server 启动失败，可以按 2 直接运行已构建版本
echo.
echo 1. 开发模式 (npm run electron:dev)
echo 2. 直接启动 (构建后运行)
echo.
set /p choice="请选择 (1/2): "

if "%choice%"=="2" (
    echo [AV Cinema] 构建中...
    call npx vite build
    echo [AV Cinema] 启动...
    start "" npx electron .
    exit /b
)

echo [AV Cinema] 启动开发模式...
start "" cmd /c "npx vite"
timeout /t 3 /nobreak >nul
npx electron .
