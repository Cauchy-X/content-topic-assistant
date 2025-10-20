@echo off
echo 正在恢复内容选题助手数据库...

REM 检查参数
if "%1"=="" (
    echo 用法: restore-databases.bat TIMESTAMP
    echo 示例: restore-databases.bat 20231115_143022
    echo.
    echo 可用的备份:
    dir /b database\backups\mongodb_* 2>nul
    dir /b database\backups\postgresql_*.sql 2>nul
    pause
    exit /b 1
)

set TIMESTAMP=%1
set BACKUP_DIR=database\backups

REM 检查备份文件是否存在
if not exist "%BACKUP_DIR%\mongodb_%TIMESTAMP%" (
    echo 错误: MongoDB备份文件不存在: %BACKUP_DIR%\mongodb_%TIMESTAMP%
    pause
    exit /b 1
)

if not exist "%BACKUP_DIR%\postgresql_%TIMESTAMP%.sql" (
    echo 错误: PostgreSQL备份文件不存在: %BACKUP_DIR%\postgresql_%TIMESTAMP%.sql
    pause
    exit /b 1
)

REM 恢复MongoDB
echo 正在恢复MongoDB...
docker cp "%BACKUP_DIR%\mongodb_%TIMESTAMP%" (docker-compose -f docker-compose.local.yml ps -q mongodb):/tmp/restore
docker-compose -f docker-compose.local.yml exec mongodb mongorestore --drop /tmp/restore

REM 恢复PostgreSQL
echo 正在恢复PostgreSQL...
docker-compose -f docker-compose.local.yml exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS content-hub;"
docker-compose -f docker-compose.local.yml exec -T postgres psql -U postgres -c "CREATE DATABASE content-hub;"
docker-compose -f docker-compose.local.yml exec -T postgres psql -U postgres content-hub < "%BACKUP_DIR%\postgresql_%TIMESTAMP%.sql"

echo.
echo 数据库恢复完成!
echo.
pause