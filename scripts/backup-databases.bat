@echo off
echo 正在备份内容选题助手数据库...

REM 设置备份目录
set BACKUP_DIR=database\backups
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

REM 创建备份目录
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM 备份MongoDB
echo 正在备份MongoDB...
docker-compose -f docker-compose.local.yml exec -T mongodb mongodump --out /tmp/backup
docker cp (docker-compose -f docker-compose.local.yml ps -q mongodb):/tmp/backup "%BACKUP_DIR%\mongodb_%TIMESTAMP%"

REM 备份PostgreSQL
echo 正在备份PostgreSQL...
docker-compose -f docker-compose.local.yml exec -T postgres pg_dump -U postgres content-hub > "%BACKUP_DIR%\postgresql_%TIMESTAMP%.sql"

echo.
echo 数据库备份完成!
echo 备份位置: %BACKUP_DIR%
echo.
pause