@echo off
echo 正在初始化内容选题助手数据库（无Docker版本）...

REM 检查MongoDB是否安装
where mongod >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到MongoDB，请先安装MongoDB或使用Docker版本
    echo 参考: docs\database-installation.md
    pause
    exit /b 1
)

REM 检查PostgreSQL是否安装
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到PostgreSQL，请先安装PostgreSQL或使用Docker版本
    echo 参考: docs\database-installation.md
    pause
    exit /b 1
)

REM 创建必要的目录
if not exist "database\mongodb\data" mkdir database\mongodb\data
if not exist "database\postgresql\data" mkdir database\postgresql\data
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads

REM 启动MongoDB（如果尚未运行）
echo 正在检查MongoDB服务状态...
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo 正在启动MongoDB服务...
    net start MongoDB
) else (
    echo MongoDB服务已在运行
)

REM 启动PostgreSQL（如果尚未运行）
echo 正在检查PostgreSQL服务状态...
sc query postgresql-x64-14 >nul 2>&1
if %errorlevel% neq 0 (
    echo 正在启动PostgreSQL服务...
    net start postgresql-x64-14
) else (
    echo PostgreSQL服务已在运行
)

REM 等待服务启动
echo 等待数据库服务启动...
timeout /t 5 /nobreak >nul

REM 初始化MongoDB数据库
echo 正在初始化MongoDB数据库...
mongo mongodb://localhost:27017/content-topic-assistant --quiet < "database\mongodb\init-mongo.js"

REM 初始化PostgreSQL数据库
echo 正在初始化PostgreSQL数据库...
set PGPASSWORD=password
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE content_hub;" 2>nul
psql -U postgres -h localhost -p 5432 -d content_hub -f "database\postgresql\init-postgres.sql"

echo.
echo 数据库初始化完成!
echo MongoDB: mongodb://localhost:27017/content-topic-assistant
echo PostgreSQL: postgresql://postgres:password@localhost:5432/content_hub
echo.
echo 请确保应用程序的.env.local文件中的数据库连接字符串与上述信息匹配
echo.
pause