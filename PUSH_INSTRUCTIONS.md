# 推送到 GitHub 的步骤

代码已经提交，现在需要推送到 GitHub。请按照以下步骤操作：

## 方式一：使用 Personal Access Token（推荐）

1. **创建 Personal Access Token**
   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token" -> "Generate new token (classic)"
   - 给 token 起个名字（如：vercel-deploy）
   - 选择过期时间（建议：90 days 或 No expiration）
   - 勾选 `repo` 权限
   - 点击 "Generate token"
   - **复制生成的 token**（只显示一次，务必保存）

2. **使用 token 推送**
   在终端运行以下命令，当提示输入密码时，粘贴你的 token（不是 GitHub 密码）：

   ```bash
   cd "/Users/xin/Desktop/new project/christmas-tree"
   export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7891
   git push origin main
   ```

   当提示：
   - Username: 输入你的 GitHub 用户名 `fdg2025`
   - Password: 粘贴刚才复制的 token（注意：输入时不会显示，直接粘贴回车即可）

## 方式二：使用 SSH（需要配置 SSH 密钥）

如果你已经配置了 SSH 密钥：

```bash
cd "/Users/xin/Desktop/new project/christmas-tree"
git remote set-url origin git@github.com:fdg2025/christmas-tree.git
git push origin main
```

如果没有配置 SSH 密钥，可以参考：
https://docs.github.com/en/authentication/connecting-to-github-with-ssh

## 方式三：在 GitHub 网站上手动上传

如果上述方式都有问题，你可以：
1. 访问 https://github.com/fdg2025/christmas-tree
2. 直接在网页上编辑文件并提交

---

**当前提交状态：**
- ✅ 已提交：`Add Vercel deployment configuration and deployment guide`
- ⏳ 待推送：2 个新文件（vercel.json, DEPLOY.md）

