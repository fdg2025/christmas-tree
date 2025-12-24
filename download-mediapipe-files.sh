#!/bin/bash

# 设置代理（如果需要）
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
export all_proxy=socks5://127.0.0.1:7891

# 创建目录
mkdir -p public/mediapipe/wasm
mkdir -p public/mediapipe/models

echo "正在下载手势识别模型文件..."
# 下载模型文件
curl -k -L "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task" \
  -o public/mediapipe/models/gesture_recognizer.task

echo "模型文件下载完成！"

echo ""
echo "正在从 npm 包中提取 WASM 文件..."

# 下载 npm 包并提取 WASM 文件
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "下载 npm 包..."
curl -k -L "https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-0.10.3.tgz" -o tasks-vision.tgz

if [ -f tasks-vision.tgz ]; then
    echo "解压 npm 包..."
    tar -xzf tasks-vision.tgz 2>/dev/null || tar -xf tasks-vision.tgz 2>/dev/null
    
    # 复制 WASM 文件（MediaPipe 0.10.3 使用 vision_wasm_* 命名）
    if [ -d package/wasm ]; then
        cp package/wasm/vision_wasm_internal.js "$OLDPWD/public/mediapipe/wasm/"
        cp package/wasm/vision_wasm_internal.wasm "$OLDPWD/public/mediapipe/wasm/"
        cp package/wasm/vision_wasm_nosimd_internal.js "$OLDPWD/public/mediapipe/wasm/"
        cp package/wasm/vision_wasm_nosimd_internal.wasm "$OLDPWD/public/mediapipe/wasm/"
        echo "WASM 文件复制完成！"
        echo "  - vision_wasm_internal.js"
        echo "  - vision_wasm_internal.wasm"
        echo "  - vision_wasm_nosimd_internal.js"
        echo "  - vision_wasm_nosimd_internal.wasm"
    else
        echo "警告: 未找到 wasm 目录"
    fi
    
    cd "$OLDPWD"
    rm -rf "$TEMP_DIR"
else
    echo "警告: 无法下载 npm 包，请手动从 node_modules 复制文件"
    echo "或者使用以下命令："
    echo "  cp -r node_modules/@mediapipe/tasks-vision/wasm public/mediapipe/"
fi

echo ""
echo "下载完成！请检查 public/mediapipe/ 目录"

