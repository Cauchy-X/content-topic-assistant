@echo off
echo 正在停止内容选题助手本地数据库...

REM 停止数据库服务
docker-compose -f docker-compose.local.yml down

echo.
echo 数据库服务已停止!
echo.
pause