# 推送 MediaPipe 本地化文件到 GitHub

## 📦 需要推送的文件

本次更新包含以下新文件和修改：

### 新增文件：
1. **MediaPipe 模型文件** (~8 MB)
   - `public/mediapipe/models/gesture_recognizer.task`

2. **MediaPipe WASM 文件** (~16 MB)
   - `public/mediapipe/wasm/vision_wasm_internal.js`
   - `public/mediapipe/wasm/vision_wasm_internal.wasm`
   - `public/mediapipe/wasm/vision_wasm_nosimd_internal.js`
   - `public/mediapipe/wasm/vision_wasm_nosimd_internal.wasm`

3. **文档文件**
   - `GESTURE_RECOGNITION.md` - 手势识别原理说明
   - `LOCALIZATION_GUIDE.md` - 本地化指南
   - `LOCALIZATION_SUMMARY.md` - 本地化总结
   - `download-mediapipe-files.sh` - 下载脚本

### 修改的文件：
- `src/App.tsx` - 更新为使用本地文件路径

## ⚠️ 重要提示

MediaPipe 文件总计约 **24 MB**，虽然可以推送到 GitHub，但请注意：

- ✅ GitHub 单个文件限制：100 MB（我们的文件在限制内）
- ⚠️ 首次推送可能需要较长时间（取决于网络速度）
- 💡 如果担心仓库过大，可以考虑使用 Git LFS（但会增加复杂度）

## 🚀 推送步骤

### 方式一：使用提供的脚本（推荐）

```bash
# 1. 给脚本添加执行权限
chmod +x GIT_PUSH.sh

# 2. 运行脚本
./GIT_PUSH.sh
```

### 方式二：手动推送

#### 1. 设置代理（如果需要）

```bash
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
export all_proxy=socks5://127.0.0.1:7891
```

#### 2. 检查 Git 状态

```bash
cd "/Users/xin/Desktop/new project/christmas-tree"
git status
```

#### 3. 添加所有文件

```bash
git add .
```

#### 4. 提交更改

```bash
git commit -m "feat: 添加手势识别本地化文件和文档

- 下载并本地化 MediaPipe WASM 文件
- 下载手势识别模型文件
- 修改代码使用本地文件路径替代 CDN
- 添加手势识别原理说明文档
- 添加本地化指南和下载脚本"
```

#### 5. 检查远程仓库

```bash
git remote -v
```

如果还没有设置远程仓库，请设置：

```bash
git remote add origin https://github.com/fdg2025/christmas-tree.git
```

#### 6. 推送到 GitHub

**使用 Personal Access Token（推荐）：**

```bash
git push origin main
```

当提示输入密码时，使用你的 GitHub Personal Access Token（不是密码）。

如果还没有 token，请：
1. 访问 https://github.com/settings/tokens
2. 创建新的 token（勾选 `repo` 权限）
3. 复制 token 并在提示密码时粘贴

**或使用 token 直接推送：**

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/fdg2025/christmas-tree.git
git push origin main
```

**使用 SSH（如果已配置）：**

```bash
git remote set-url origin git@github.com:fdg2025/christmas-tree.git
git push origin main
```

## 📊 推送进度

由于文件较大，推送时可以看到进度：

```
Writing objects: 100% (XX/XX), 24.5 MB | 2.5 MB/s, done.
```

## ✅ 验证推送成功

推送完成后，访问 https://github.com/fdg2025/christmas-tree 检查：

1. ✅ `public/mediapipe/` 目录应该包含所有文件
2. ✅ `GESTURE_RECOGNITION.md` 等文档应该可见
3. ✅ `src/App.tsx` 应该显示使用本地路径的代码

## 🔄 如果推送失败

### 问题1: 文件太大超时

```bash
# 增加 Git 缓冲区大小
git config http.postBuffer 524288000
git push origin main
```

### 问题2: 认证失败

确保使用 Personal Access Token 而不是密码：
- 访问 https://github.com/settings/tokens
- 创建新的 token 并复制
- 使用 token 作为密码

### 问题3: 网络问题

确保代理设置正确，或尝试不使用代理：

```bash
unset https_proxy http_proxy all_proxy
git push origin main
```

## 📝 后续维护

如果将来需要更新 MediaPipe 文件：

1. 运行 `download-mediapipe-files.sh` 重新下载
2. 提交并推送更改

---

**参考文档：**
- [GitHub 文件大小限制](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
- [创建 Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

