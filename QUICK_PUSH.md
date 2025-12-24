# 🚀 快速推送指南

## 一键推送命令

```bash
cd "/Users/xin/Desktop/new project/christmas-tree"

# 设置代理
export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7891

# 添加所有文件
git add .

# 提交
git commit -m "feat: 添加手势识别本地化文件和文档

- 下载并本地化 MediaPipe WASM 文件
- 下载手势识别模型文件
- 修改代码使用本地文件路径替代 CDN
- 添加手势识别原理说明文档
- 添加本地化指南和下载脚本"

# 设置远程仓库（如果还没有）
git remote add origin https://github.com/fdg2025/christmas-tree.git 2>/dev/null || git remote set-url origin https://github.com/fdg2025/christmas-tree.git

# 推送到 GitHub（会提示输入用户名和 token）
git push -u origin main
```

## ⚡ 如果需要使用 Token 直接推送

```bash
# 替换 YOUR_TOKEN 为你的 GitHub Personal Access Token
git remote set-url origin https://YOUR_TOKEN@github.com/fdg2025/christmas-tree.git
git push -u origin main
```

## 📋 创建 Token 步骤

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" -> "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 生成并复制 token
5. 在推送时作为密码使用

---

💡 **提示**: 由于 MediaPipe 文件较大（约 24MB），首次推送可能需要几分钟时间。

