@echo off
REM 内容选题助手启动脚本 (Windows)

echo 正在启动内容选题助手...

REM 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: Node.js未安装，请先安装Node.js
    pause
    exit /b 1
)

REM 检查npm是否安装
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: npm未安装，请先安装npm
    pause
    exit /b 1
)

REM 安装前端依赖
echo 安装前端依赖...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo 错误: 前端依赖安装失败
    pause
    exit /b 1
)

REM 安装后端依赖
echo 安装后端依赖...
cd ..\backend
call npm install
if %errorlevel% neq 0 (
    echo 错误: 后端依赖安装失败
    pause
    exit /b 1
)

REM 启动后端服务
echo 启动后端服务...
start "后端服务" cmd /k "npm run dev"

REM 等待后端服务启动
timeout /t 5 /nobreak >nul

REM 启动前端服务
echo 启动前端服务...
cd ..\frontend
start "前端服务" cmd /k "npm start"

echo 内容选题助手已启动
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:5000
echo 按任意键退出...
pause >nul