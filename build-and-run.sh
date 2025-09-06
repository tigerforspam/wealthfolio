#!/bin/bash

# 确保脚本在同一目录下
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 检查依赖脚本是否存在
if [ ! -f "$SCRIPT_DIR/build.sh" ]; then
    echo "错误：build.sh 脚本不存在"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/run.sh" ]; then
    echo "错误：run.sh 脚本不存在"
    exit 1
fi

# 执行构建
echo "=== 开始构建阶段 ==="
bash "$SCRIPT_DIR/build.sh"
BUILD_RESULT=$?

if [ $BUILD_RESULT -ne 0 ]; then
    echo "构建失败，退出码: $BUILD_RESULT"
    exit $BUILD_RESULT
fi

echo ""
echo "=== 构建完成，开始运行阶段 ==="

# 执行运行
bash "$SCRIPT_DIR/run.sh"
RUN_RESULT=$?

if [ $RUN_RESULT -ne 0 ]; then
    echo "运行失败，退出码: $RUN_RESULT"
    exit $RUN_RESULT
fi

echo ""
echo "=== 构建和运行流程完成 ==="
