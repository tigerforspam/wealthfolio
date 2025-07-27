#!/bin/bash

PORT=1420

# 检测端口是否被占用
if lsof -i :$PORT > /dev/null; then
    echo "端口 $PORT 被占用，尝试关闭占用进程..."
    PID=$(lsof -t -i :$PORT)
    kill -9 $PID
    echo "已关闭进程 $PID"
fi

echo "端口检测完成，开始构建.."

# 安装依赖
echo "安装前端依赖..."
npm install

echo "安装Rust依赖..."
cd src-tauri
cargo fetch
cd ..

# 构建前端
echo "构建前端..."
npm run build

# 构建后端
echo "构建后端..."
cd src-tauri
cargo tauri build
cd ..

# 启动应用
echo "启动应用..."
cd src-tauri
cargo tauri dev
