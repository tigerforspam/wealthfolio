#!/bin/bash

echo "开始构建项目..."

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

echo "构建完成！"