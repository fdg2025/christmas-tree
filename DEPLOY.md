# 🚀 Vercel 部署指南

本项目已配置好 Vercel 部署，可以一键部署到 Vercel 平台。

## 📋 部署步骤

### 方法一：通过 Vercel 网站部署（推荐）

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub/GitLab/Bitbucket 账号登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择你的 GitHub 仓库 `christmas-tree`
   - Vercel 会自动检测到这是一个 Vite 项目

3. **配置项目**
   - **Framework Preset**: Vite (自动检测)
   - **Build Command**: `npm run build` (自动填充)
   - **Output Directory**: `dist` (自动填充)
   - **Install Command**: `npm install` (自动填充)

4. **环境变量**
   - 本项目无需额外环境变量
   - 摄像头功能在生产环境的 HTTPS 环境下可以正常工作

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（通常 1-2 分钟）

### 方法二：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   cd christmas-tree
   vercel
   ```

4. **生产环境部署**
   ```bash
   vercel --prod
   ```

## ⚙️ 配置说明

项目已包含 `vercel.json` 配置文件，主要配置如下：

- **Framework**: 自动识别为 Vite
- **SPA 路由**: 所有路由重定向到 `index.html`，支持前端路由
- **构建输出**: `dist` 目录

## 📝 注意事项

1. **HTTPS 要求**
   - 摄像头功能（MediaPipe）需要在 HTTPS 环境下运行
   - Vercel 自动提供 HTTPS，无需额外配置

2. **摄像头权限**
   - 用户首次访问时浏览器会请求摄像头权限
   - 需要用户授权才能使用手势识别功能

3. **性能优化**
   - 项目包含大量 3D 粒子和特效，建议在现代浏览器中运行
   - 如果性能较差，可以在 `src/App.tsx` 中调整 `CONFIG.counts` 降低粒子数量

4. **照片资源**
   - `public/photos/` 目录中的照片会随项目一起部署
   - 确保照片文件大小合理（建议单张 < 500KB）

## 🔗 部署后

部署成功后，你会获得一个类似 `https://your-project.vercel.app` 的 URL。

- 生产环境会自动使用 HTTPS
- 每次推送到主分支会自动触发新的部署
- 可以通过 Vercel Dashboard 查看部署日志和性能指标

## 🐛 故障排除

如果遇到部署问题：

1. **构建失败**
   - 检查 Node.js 版本（建议 v18+）
   - 查看构建日志中的错误信息
   - 确保所有依赖都在 `package.json` 中

2. **页面空白**
   - 检查浏览器控制台错误
   - 确认所有资源路径正确（使用相对路径）
   - 检查 `vercel.json` 的 rewrites 配置

3. **摄像头无法使用**
   - 确认网站使用 HTTPS（Vercel 自动提供）
   - 检查浏览器是否支持 `getUserMedia` API
   - 查看浏览器控制台是否有权限错误

---

祝你部署顺利！🎄✨

