# 手势识别原理说明

## 概述

本项目使用 **MediaPipe Gesture Recognizer** 来实现基于摄像头的手势识别功能，通过识别手势来控制3D圣诞树的场景状态和旋转速度。

## 技术架构

### 1. 核心技术栈
- **MediaPipe Tasks Vision**: Google 提供的端到端视觉任务解决方案
- **WebAssembly (WASM)**: 在浏览器中高效运行机器学习模型
- **TensorFlow Lite**: 底层模型推理引擎（由 MediaPipe 封装）

### 2. 手势识别流程

```
摄像头视频流 → MediaPipe 预处理 → 手势检测模型 → 手势分类 → 场景控制
```

#### 详细步骤：

1. **初始化阶段** (`setup` 函数)
   - 从 CDN/本地加载 MediaPipe WASM 运行时文件
   - 加载手势识别模型文件 (`gesture_recognizer.task`)
   - 创建 `GestureRecognizer` 实例，配置为视频模式 (`VIDEO` running mode)
   - 请求摄像头权限并启动视频流

2. **实时识别阶段** (`predictWebcam` 函数)
   - 使用 `requestAnimationFrame` 实现连续帧捕获
   - 对每一帧视频调用 `recognizeForVideo()` 进行手势识别
   - 提取识别结果：手势类别和手部关键点（landmarks）

3. **手势映射** (`App.tsx:479-489`)
   - **Open_Palm (张开手掌)**: 触发 `CHAOS` 状态 → 圣诞树分散
   - **Closed_Fist (握拳)**: 触发 `FORMED` 状态 → 圣诞树组装
   - **手部位置**: 通过 `landmarks[0][0].x` 计算旋转速度
     - 手在屏幕左侧 → 向左旋转
     - 手在屏幕右侧 → 向右旋转
     - 速度公式: `(0.5 - x) * 0.15`

### 3. 关键代码解析

#### 手势识别器初始化
```typescript
const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: "/mediapipe/models/gesture_recognizer.task",
    delegate: "GPU"  // 使用 GPU 加速（如果可用）
  },
  runningMode: "VIDEO",  // 视频模式，实时识别
  numHands: 1  // 只识别一只手
});
```

#### 手势识别循环
```typescript
const results = gestureRecognizer.recognizeForVideo(videoRef.current, Date.now());
if (results.gestures.length > 0) {
  const name = results.gestures[0][0].categoryName;  // 手势名称
  const score = results.gestures[0][0].score;        // 置信度分数
  
  if (score > 0.4) {  // 置信度阈值
    if (name === "Open_Palm") onGesture("CHAOS");
    if (name === "Closed_Fist") onGesture("FORMED");
  }
  
  // 使用手部位置控制旋转
  if (results.landmarks.length > 0) {
    const speed = (0.5 - results.landmarks[0][0].x) * 0.15;
    onMove(speed);
  }
}
```

### 4. 识别的数据结构

#### Gesture 结果
- `categoryName`: 手势类别名称（如 "Open_Palm", "Closed_Fist"）
- `score`: 置信度分数（0-1之间，>0.4 才认为有效）

#### Landmarks 结果
- 手部 21 个关键点的 3D 坐标
- `landmarks[0][0]` 是手腕位置，x 坐标范围 0-1（归一化）
- 用于计算手在屏幕上的水平位置，控制旋转速度

### 5. 性能优化

1. **GPU 加速**: 使用 `delegate: "GPU"` 利用 WebGPU/WebGL 加速
2. **单手指模式**: `numHands: 1` 减少计算量
3. **置信度阈值**: `score > 0.4` 过滤低置信度结果
4. **requestAnimationFrame**: 与浏览器刷新率同步，避免过度计算

## 本地化文件说明

为了离线运行和更好的性能，以下文件需要下载到本地：

1. **MediaPipe WASM 文件** (`/mediapipe/wasm/`)
   - 原始 URL: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm`
   - 包含 MediaPipe 的 WebAssembly 运行时文件

2. **手势识别模型** (`/mediapipe/models/gesture_recognizer.task`)
   - 原始 URL: `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task`
   - 预训练的手势识别模型文件（约 20-30 MB）

## 使用说明

1. 确保摄像头权限已授予
2. 在摄像头前展示手势：
   - **张开手掌** → 圣诞树分散成粒子状态
   - **握拳** → 圣诞树组装完成
   - **左右移动手** → 控制树的旋转方向和速度
3. 打开 DEBUG 模式可查看手部关键点可视化

## 参考资料

- [MediaPipe Gesture Recognizer](https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer)
- [MediaPipe Tasks Vision API](https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer/web_js)

