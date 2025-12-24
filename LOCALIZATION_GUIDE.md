# 外部文件本地化指南

## 概述

本项目使用 MediaPipe 进行手势识别，需要以下外部文件：

1. **手势识别模型文件** (`gesture_recognizer.task`)
   - 已下载到: `public/mediapipe/models/gesture_recognizer.task`

2. **MediaPipe WASM 运行时文件** (WASM 目录)
   - 需要下载到: `public/mediapipe/wasm/`

## 文件下载方法

### 方法1: 使用提供的下载脚本（推荐）

```bash
chmod +x download-mediapipe-files.sh
./download-mediapipe-files.sh
```

### 方法2: 从 node_modules 复制（如果已安装 npm 包）

```bash
# 确保已安装依赖
npm install

# 复制 WASM 文件
cp -r node_modules/@mediapipe/tasks-vision/wasm public/mediapipe/

# 如果 wasm 目录不存在，尝试查找：
find node_modules/@mediapipe -name "*.wasm" -o -name "*wasm*.js"
```

### 方法3: 手动下载 WASM 文件

MediaPipe 的 WASM 文件可以从以下位置获取：

1. **从 npm 包提取**:
   ```bash
   # 下载 npm 包
   curl -L https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-0.10.3.tgz -o tasks-vision.tgz
   
   # 解压并查找 wasm 目录
   tar -xzf tasks-vision.tgz
   find package -name "wasm" -type d
   
   # 复制 wasm 目录内容到 public/mediapipe/wasm/
   cp -r package/wasm/* public/mediapipe/wasm/
   ```

2. **使用 unpkg CDN** (如果允许网络访问):
   - 访问: https://unpkg.com/@mediapipe/tasks-vision@0.10.3/
   - 查找 wasm 目录并下载其中的文件

## WASM 文件说明

MediaPipe WASM 目录通常包含以下文件：

- `wasm_nosimd_internal.js` - 无 SIMD 支持的 JS 加载器
- `wasm_nosimd_internal.wasm` - 无 SIMD 支持的 WASM 二进制
- `wasm_simd_internal.js` - 带 SIMD 支持的 JS 加载器  
- `wasm_simd_internal.wasm` - 带 SIMD 支持的 WASM 二进制
- `*.wasm.map` - Source maps（可选）

MediaPipe 会自动检测浏览器支持并选择使用 SIMD 或非 SIMD 版本。

## 验证文件

下载完成后，请确认以下文件存在：

```
public/mediapipe/
├── models/
│   └── gesture_recognizer.task  (约 8MB)
└── wasm/
    ├── wasm_nosimd_internal.js
    ├── wasm_nosimd_internal.wasm
    ├── wasm_simd_internal.js
    └── wasm_simd_internal.wasm
```

## 代码修改

文件下载后，代码中的路径已经修改为使用本地文件：

```typescript
// 原代码（使用 CDN）
const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
);

// 修改后（使用本地文件）
const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
```

模型文件路径：
```typescript
// 原代码
modelAssetPath: "https://storage.googleapis.com/mediapipe-models/..."

// 修改后
modelAssetPath: "/mediapipe/models/gesture_recognizer.task"
```

## 注意事项

1. 确保文件路径正确，相对于 `public` 目录
2. 如果使用 Vite，`public` 目录中的文件在运行时位于根路径 `/`
3. 模型文件较大（约 8MB），首次加载可能需要一些时间
4. WASM 文件需要正确的 MIME 类型，通常由服务器自动处理

