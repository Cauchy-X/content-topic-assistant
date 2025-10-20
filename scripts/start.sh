#!/bin/bash

# 内容选题助手启动脚本

echo "正在启动内容选题助手..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: npm未安装，请先安装npm"
    exit 1
fi

# 检查MongoDB是否运行
if ! pgrep -x "mongod" > /dev/null; then
    echo "警告: MongoDB未运行，请确保MongoDB已安装并启动"
fi

# 安装前端依赖
echo "安装前端依赖..."
cd frontend
npm install

# 安装后端依赖
echo "安装后端依赖..."
cd ../backend
npm install

# 启动后端服务
echo "启动后端服务..."
npm run dev &
BACKEND_PID=$!

# 等待后端服务启动
sleep 5

# 启动前端服务
echo "启动前端服务..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "内容选题助手已启动"
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:5000"
echo "按Ctrl+C停止服务"

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait