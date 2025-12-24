#!/bin/bash

# Git 推送脚本
# 使用方法: ./GIT_PUSH.sh

set -e

echo "🚀 开始推送代码到 GitHub..."

# 设置代理（如果需要）
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
export all_proxy=socks5://127.0.0.1:7891

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查 Git 是否初始化
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
fi

# 检查远程仓库配置
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo "🔗 设置远程仓库..."
    git remote add origin https://github.com/fdg2025/christmas-tree.git
elif [ "$REMOTE_URL" != "https://github.com/fdg2025/christmas-tree.git" ]; then
    echo "🔗 更新远程仓库地址..."
    git remote set-url origin https://github.com/fdg2025/christmas-tree.git
fi

# 显示当前状态
echo ""
echo "📊 当前 Git 状态:"
git status --short

echo ""
echo "📝 添加所有文件到暂存区..."
git add .

# 检查是否有变更
if git diff --cached --quiet && git diff --quiet; then
    echo "ℹ️  没有需要提交的变更"
    exit 0
fi

# 提交信息
COMMIT_MSG="feat: 添加手势识别本地化文件和文档

- 下载并本地化 MediaPipe WASM 文件
- 下载手势识别模型文件 (gesture_recognizer.task)
- 修改代码使用本地文件路径替代 CDN
- 添加手势识别原理说明文档
- 添加本地化指南和下载脚本"

echo ""
echo "💾 提交变更..."
git commit -m "$COMMIT_MSG"

echo ""
echo "📤 推送到 GitHub..."
echo "⚠️  注意: MediaPipe 文件较大（约 24MB），首次推送可能需要一些时间"

# 尝试推送
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

if [ -z "$BRANCH" ]; then
    git checkout -b main
    BRANCH="main"
fi

# 设置上游分支（如果还没有）
git push -u origin "$BRANCH" || {
    echo ""
    echo "⚠️  推送失败，可能的原因："
    echo "1. 需要身份验证（请使用 token 或 SSH）"
    echo "2. 网络问题（检查代理设置）"
    echo ""
    echo "💡 如果需要使用 token 认证，请运行："
    echo "   git remote set-url origin https://YOUR_TOKEN@github.com/fdg2025/christmas-tree.git"
    echo ""
    echo "   或使用 SSH："
    echo "   git remote set-url origin git@github.com:fdg2025/christmas-tree.git"
    exit 1
}

echo ""
echo "✅ 推送成功！"
echo "🌐 查看仓库: https://github.com/fdg2025/christmas-tree"

