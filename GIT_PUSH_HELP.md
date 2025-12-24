# Git 推送帮助指南

## 问题：403 Permission denied

这通常是因为使用了错误的认证方式。请按以下步骤操作：

## ✅ 方法一：使用 Personal Access Token（推荐）

### 步骤 1: 创建新的 Token

1. 访问：https://github.com/settings/tokens/new
2. 或者：GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)

3. **设置 Token：**
   - **Note**: 输入一个描述，如 "christmas-tree-deploy"
   - **Expiration**: 选择过期时间（建议 90 days 或 No expiration）
   - **权限（Scopes）**: ⚠️ **必须勾选 `repo` 权限**（这会自动勾选所有 repo 相关权限）
     - ✅ repo (Full control of private repositories)
   
4. 点击 "Generate token" 按钮
5. **立即复制 token**（只显示一次！格式类似：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

### 步骤 2: 使用 Token 推送

**重要：** 当 Git 提示输入密码时，**粘贴 token，而不是你的 GitHub 密码！**

```bash
cd "/Users/xin/Desktop/new project/christmas-tree"
export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7891
git push origin main
```

当提示：
- **Username for 'https://github.com':** `fdg2025`
- **Password for 'https://fdg2025@github.com':** 粘贴刚才复制的 token（输入时不会显示，直接粘贴回车）

### 步骤 3: 验证

如果成功，你会看到类似这样的输出：
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
...
To https://github.com/fdg2025/christmas-tree.git
   xxxxx..xxxxx  main -> main
```

---

## ✅ 方法二：在 URL 中包含 Token（临时方案）

如果你不想每次都输入，可以临时在 URL 中包含 token：

```bash
cd "/Users/xin/Desktop/new project/christmas-tree"
export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7891

# 替换 YOUR_TOKEN 为你的实际 token
git remote set-url origin https://YOUR_TOKEN@github.com/fdg2025/christmas-tree.git
git push origin main

# 推送完成后，建议移除 URL 中的 token（为了安全）
git remote set-url origin https://github.com/fdg2025/christmas-tree.git
```

⚠️ **注意：** 这种方式 token 会保存在 Git 配置中，不够安全。建议使用方法一。

---

## ✅ 方法三：使用 SSH（需要配置 SSH 密钥）

如果你已经配置了 SSH 密钥：

```bash
cd "/Users/xin/Desktop/new project/christmas-tree"
git remote set-url origin git@github.com:fdg2025/christmas-tree.git
git push origin main
```

如果没有 SSH 密钥，可以参考：https://docs.github.com/en/authentication/connecting-to-github-with-ssh

---

## ❌ 常见错误

### 错误 1: 403 Permission denied
- ✅ **解决**: 确保使用的是 Personal Access Token，不是 GitHub 密码
- ✅ **检查**: Token 是否有 `repo` 权限

### 错误 2: Token 输入后仍然 403
- ✅ **解决**: 重新生成一个新的 token
- ✅ **检查**: Token 是否已过期

### 错误 3: 提示 "Device not configured"
- ✅ **解决**: 在终端中手动执行命令（而不是通过某些自动化工具）

---

## 🔒 安全提示

1. **不要**将 token 提交到 Git 仓库
2. **不要**在公开场合分享 token
3. 定期轮换 token（更改密码）
4. 使用最短的必要权限
5. 如果 token 泄露，立即在 GitHub 上撤销它

---

## 📝 快速检查清单

- [ ] 已创建 Personal Access Token
- [ ] Token 有 `repo` 权限
- [ ] 已复制 token（格式：`ghp_...`）
- [ ] 使用 token 作为密码（不是 GitHub 密码）
- [ ] 代理设置正确
- [ ] 在正确的目录中执行命令

