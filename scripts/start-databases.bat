@echo off
echo 正在启动内容选题助手本地数据库...

REM 检查Docker是否运行
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Docker未运行，请先启动Docker Desktop
    pause
    exit /b 1
)

REM 创建必要的目录
if not exist "database\mongodb" mkdir database\mongodb
if not exist "database\postgresql" mkdir database\postgresql
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads

REM 启动数据库服务
echo 正在启动MongoDB、PostgreSQL和Redis服务...
docker-compose -f docker-compose.local.yml up -d mongodb postgres redis

echo 等待数据库服务启动...
timeout /t 10 /nobreak >nul

REM 检查服务状态
echo 检查服务状态...
docker-compose -f docker-compose.local.yml ps

echo.
echo 数据库服务已启动!
echo MongoDB: mongodb://localhost:27017
echo PostgreSQL: postgresql://postgres:password@localhost:5432/content-hub
echo Redis: redis://localhost:6379
echo.
echo 使用以下命令停止数据库服务:
echo docker-compose -f docker-compose.local.yml down
echo.
pause