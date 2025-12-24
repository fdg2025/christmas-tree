import { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
  shaderMaterial,
  Float,
  Stars,
  Sparkles,
  useTexture
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { MathUtils } from 'three';
import * as random from 'maath/random';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

// --- 动态生成照片列表 (top.jpg + 1.jpg 到 31.jpg) ---
const TOTAL_NUMBERED_PHOTOS = 31;
// 修改：将 top.jpg 加入到数组开头
const bodyPhotoPaths = [
  '/photos/top.jpg',
  ...Array.from({ length: TOTAL_NUMBERED_PHOTOS }, (_, i) => `/photos/${i + 1}.jpg`)
];

// --- 视觉配置 ---
const CONFIG = {
  colors: {
    emerald: '#004225', // 纯正祖母绿
    gold: '#FFD700',
    silver: '#ECEFF1',
    red: '#D32F2F',
    green: '#2E7D32',
    white: '#FFFFFF',   // 纯白色
    warmLight: '#FFD54F',
    lights: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'], // 彩灯
    // 拍立得边框颜色池 (复古柔和色系)
    borders: ['#FFFAF0', '#F0E68C', '#E6E6FA', '#FFB6C1', '#98FB98', '#87CEFA', '#FFDAB9'],
    // 圣诞元素颜色
    giftColors: ['#D32F2F', '#FFD700', '#1976D2', '#2E7D32'],
    candyColors: ['#FF0000', '#FFFFFF']
  },
  counts: {
    foliage: 15000,
    ornaments: 300,   // 拍立得照片数量
    elements: 200,    // 圣诞元素数量
    lights: 400       // 彩灯数量
  },
  tree: { height: 22, radius: 9 }, // 树体尺寸
  photos: {
    // top 属性不再需要，因为已经移入 body
    body: bodyPhotoPaths
  }
};

// --- Shader Material (Foliage) ---
const FoliageMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color(CONFIG.colors.emerald), uProgress: 0 },
  `uniform float uTime; uniform float uProgress; attribute vec3 aTargetPos; attribute float aRandom;
  varying vec2 vUv; varying float vMix;
  float cubicInOut(float t) { return t < 0.5 ? 4.0 * t * t * t : 0.5 * pow(2.0 * t - 2.0, 3.0) + 1.0; }
  void main() {
    vUv = uv;
    vec3 noise = vec3(sin(uTime * 1.5 + position.x), cos(uTime + position.y), sin(uTime * 1.5 + position.z)) * 0.15;
    float t = cubicInOut(uProgress);
    vec3 finalPos = mix(position, aTargetPos + noise, t);
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_PointSize = (60.0 * (1.0 + aRandom)) / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
    vMix = t;
  }`,
  `uniform vec3 uColor; varying float vMix;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5)); 
    if (r > 0.5) discard;
    // 添加平滑边缘和增强亮度
    float smoothEdge = 1.0 - smoothstep(0.3, 0.5, r);
    vec3 finalColor = mix(uColor * 0.4, uColor * 1.5, vMix) * smoothEdge;
    gl_FragColor = vec4(finalColor, 1.0);
  }`
);
extend({ FoliageMaterial });

// --- Helper: Tree Shape ---
const getTreePosition = () => {
  const h = CONFIG.tree.height; const rBase = CONFIG.tree.radius;
  const y = (Math.random() * h) - (h / 2); const normalizedY = (y + (h/2)) / h;
  const currentRadius = rBase * (1 - normalizedY); const theta = Math.random() * Math.PI * 2;
  const r = Math.random() * currentRadius;
  return [r * Math.cos(theta), y, r * Math.sin(theta)];
};

// --- Component: Foliage ---
const Foliage = ({ state }: { state: 'CHAOS' | 'FORMED' }) => {
  const materialRef = useRef<any>(null);
  const { positions, targetPositions, randoms } = useMemo(() => {
    const count = CONFIG.counts.foliage;
    const positions = new Float32Array(count * 3); const targetPositions = new Float32Array(count * 3); const randoms = new Float32Array(count);
    const spherePoints = random.inSphere(new Float32Array(count * 3), { radius: 25 }) as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i*3] = spherePoints[i*3]; positions[i*3+1] = spherePoints[i*3+1]; positions[i*3+2] = spherePoints[i*3+2];
      const [tx, ty, tz] = getTreePosition();
      targetPositions[i*3] = tx; targetPositions[i*3+1] = ty; targetPositions[i*3+2] = tz;
      randoms[i] = Math.random();
    }
    return { positions, targetPositions, randoms };
  }, []);
  useFrame((rootState, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime = rootState.clock.elapsedTime;
      const targetProgress = state === 'FORMED' ? 1 : 0;
      materialRef.current.uProgress = MathUtils.damp(materialRef.current.uProgress, targetProgress, 1.5, delta);
    }
  });
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aTargetPos" args={[targetPositions, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      </bufferGeometry>
      {/* @ts-ignore */}
      <foliageMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

// --- Component: Photo Ornaments (Double-Sided Polaroid) ---
const PhotoOrnaments = ({ state }: { state: 'CHAOS' | 'FORMED' }) => {
  const textures = useTexture(CONFIG.photos.body);
  const count = CONFIG.counts.ornaments;
  const groupRef = useRef<THREE.Group>(null);

  const borderGeometry = useMemo(() => new THREE.PlaneGeometry(1.2, 1.5), []);
  const photoGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const chaosPos = new THREE.Vector3((Math.random()-0.5)*70, (Math.random()-0.5)*70, (Math.random()-0.5)*70);
      const h = CONFIG.tree.height; const y = (Math.random() * h) - (h / 2);
      const rBase = CONFIG.tree.radius;
      const currentRadius = (rBase * (1 - (y + (h/2)) / h)) + 0.5;
      const theta = Math.random() * Math.PI * 2;
      const targetPos = new THREE.Vector3(currentRadius * Math.cos(theta), y, currentRadius * Math.sin(theta));

      const isBig = Math.random() < 0.2;
      const baseScale = isBig ? 2.2 : 0.8 + Math.random() * 0.6;
      const weight = 0.8 + Math.random() * 1.2;
      const borderColor = CONFIG.colors.borders[Math.floor(Math.random() * CONFIG.colors.borders.length)];

      const rotationSpeed = {
        x: (Math.random() - 0.5) * 1.0,
        y: (Math.random() - 0.5) * 1.0,
        z: (Math.random() - 0.5) * 1.0
      };
      const chaosRotation = new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);

      return {
        chaosPos, targetPos, scale: baseScale, weight,
        textureIndex: i % textures.length,
        borderColor,
        currentPos: chaosPos.clone(),
        chaosRotation,
        rotationSpeed,
        wobbleOffset: Math.random() * 10,
        wobbleSpeed: 0.5 + Math.random() * 0.5
      };
    });
  }, [textures, count]);

  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;
    const isFormed = state === 'FORMED';
    const time = stateObj.clock.elapsedTime;

    groupRef.current.children.forEach((group, i) => {
      const objData = data[i];
      const target = isFormed ? objData.targetPos : objData.chaosPos;

      objData.currentPos.lerp(target, delta * (isFormed ? 0.8 * objData.weight : 0.5));
      group.position.copy(objData.currentPos);

      if (isFormed) {
         const targetLookPos = new THREE.Vector3(group.position.x * 2, group.position.y + 0.5, group.position.z * 2);
         group.lookAt(targetLookPos);

         const wobbleX = Math.sin(time * objData.wobbleSpeed + objData.wobbleOffset) * 0.05;
         const wobbleZ = Math.cos(time * objData.wobbleSpeed * 0.8 + objData.wobbleOffset) * 0.05;
         group.rotation.x += wobbleX;
         group.rotation.z += wobbleZ;

      } else {
         group.rotation.x += delta * objData.rotationSpeed.x;
         group.rotation.y += delta * objData.rotationSpeed.y;
         group.rotation.z += delta * objData.rotationSpeed.z;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((obj, i) => (
        <group key={i} scale={[obj.scale, obj.scale, obj.scale]} rotation={state === 'CHAOS' ? obj.chaosRotation : [0,0,0]}>
          {/* 正面 */}
          <group position={[0, 0, 0.015]}>
            <mesh geometry={photoGeometry}>
              <meshStandardMaterial
                map={textures[obj.textureIndex]}
                roughness={0.2} 
                metalness={0.2}
                emissive={CONFIG.colors.white} 
                emissiveMap={textures[obj.textureIndex]} 
                emissiveIntensity={1.5}
                side={THREE.FrontSide}
                envMapIntensity={1.5}
              />
            </mesh>
            <mesh geometry={borderGeometry} position={[0, -0.15, -0.01]}>
              <meshStandardMaterial 
                color={obj.borderColor} 
                roughness={0.7} 
                metalness={0.05} 
                side={THREE.FrontSide}
                emissive={obj.borderColor}
                emissiveIntensity={0.1}
              />
            </mesh>
          </group>
          {/* 背面 */}
          <group position={[0, 0, -0.015]} rotation={[0, Math.PI, 0]}>
            <mesh geometry={photoGeometry}>
              <meshStandardMaterial
                map={textures[obj.textureIndex]}
                roughness={0.2} 
                metalness={0.2}
                emissive={CONFIG.colors.white} 
                emissiveMap={textures[obj.textureIndex]} 
                emissiveIntensity={1.5}
                side={THREE.FrontSide}
                envMapIntensity={1.5}
              />
            </mesh>
            <mesh geometry={borderGeometry} position={[0, -0.15, -0.01]}>
              <meshStandardMaterial 
                color={obj.borderColor} 
                roughness={0.7} 
                metalness={0.05} 
                side={THREE.FrontSide}
                emissive={obj.borderColor}
                emissiveIntensity={0.1}
              />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};

// --- Component: Christmas Elements ---
const ChristmasElements = ({ state }: { state: 'CHAOS' | 'FORMED' }) => {
  const count = CONFIG.counts.elements;
  const groupRef = useRef<THREE.Group>(null);

  const boxGeometry = useMemo(() => new THREE.BoxGeometry(0.8, 0.8, 0.8), []);
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.5, 16, 16), []);
  const caneGeometry = useMemo(() => new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8), []);

  const data = useMemo(() => {
    return new Array(count).fill(0).map(() => {
      const chaosPos = new THREE.Vector3((Math.random()-0.5)*60, (Math.random()-0.5)*60, (Math.random()-0.5)*60);
      const h = CONFIG.tree.height;
      const y = (Math.random() * h) - (h / 2);
      const rBase = CONFIG.tree.radius;
      const currentRadius = (rBase * (1 - (y + (h/2)) / h)) * 0.95;
      const theta = Math.random() * Math.PI * 2;

      const targetPos = new THREE.Vector3(currentRadius * Math.cos(theta), y, currentRadius * Math.sin(theta));

      const type = Math.floor(Math.random() * 3);
      let color; let scale = 1;
      if (type === 0) { color = CONFIG.colors.giftColors[Math.floor(Math.random() * CONFIG.colors.giftColors.length)]; scale = 0.8 + Math.random() * 0.4; }
      else if (type === 1) { color = CONFIG.colors.giftColors[Math.floor(Math.random() * CONFIG.colors.giftColors.length)]; scale = 0.6 + Math.random() * 0.4; }
      else { color = Math.random() > 0.5 ? CONFIG.colors.red : CONFIG.colors.white; scale = 0.7 + Math.random() * 0.3; }

      const rotationSpeed = { x: (Math.random()-0.5)*2.0, y: (Math.random()-0.5)*2.0, z: (Math.random()-0.5)*2.0 };
      return { type, chaosPos, targetPos, color, scale, currentPos: chaosPos.clone(), chaosRotation: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI), rotationSpeed };
    });
  }, [boxGeometry, sphereGeometry, caneGeometry]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const isFormed = state === 'FORMED';
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const objData = data[i];
      const target = isFormed ? objData.targetPos : objData.chaosPos;
      objData.currentPos.lerp(target, delta * 1.5);
      mesh.position.copy(objData.currentPos);
      mesh.rotation.x += delta * objData.rotationSpeed.x; mesh.rotation.y += delta * objData.rotationSpeed.y; mesh.rotation.z += delta * objData.rotationSpeed.z;
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((obj, i) => {
        let geometry; if (obj.type === 0) geometry = boxGeometry; else if (obj.type === 1) geometry = sphereGeometry; else geometry = caneGeometry;
        return ( <mesh key={i} scale={[obj.scale, obj.scale, obj.scale]} geometry={geometry} rotation={obj.chaosRotation}>
          <meshStandardMaterial 
            color={obj.color} 
            roughness={0.15} 
            metalness={0.6} 
            emissive={obj.color} 
            emissiveIntensity={0.5}
            envMapIntensity={1.5}
          />
        </mesh> )})}
    </group>
  );
};

// --- Component: Fairy Lights ---
const FairyLights = ({ state }: { state: 'CHAOS' | 'FORMED' }) => {
  const count = CONFIG.counts.lights;
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.8, 8, 8), []);

  const data = useMemo(() => {
    return new Array(count).fill(0).map(() => {
      const chaosPos = new THREE.Vector3((Math.random()-0.5)*60, (Math.random()-0.5)*60, (Math.random()-0.5)*60);
      const h = CONFIG.tree.height; const y = (Math.random() * h) - (h / 2); const rBase = CONFIG.tree.radius;
      const currentRadius = (rBase * (1 - (y + (h/2)) / h)) + 0.3; const theta = Math.random() * Math.PI * 2;
      const targetPos = new THREE.Vector3(currentRadius * Math.cos(theta), y, currentRadius * Math.sin(theta));
      const color = CONFIG.colors.lights[Math.floor(Math.random() * CONFIG.colors.lights.length)];
      const speed = 2 + Math.random() * 3;
      return { chaosPos, targetPos, color, speed, currentPos: chaosPos.clone(), timeOffset: Math.random() * 100 };
    });
  }, []);

  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;
    const isFormed = state === 'FORMED';
    const time = stateObj.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const objData = data[i];
      const target = isFormed ? objData.targetPos : objData.chaosPos;
      objData.currentPos.lerp(target, delta * 2.0);
      const mesh = child as THREE.Mesh;
      mesh.position.copy(objData.currentPos);
      // 使用更平滑的闪烁效果
      const intensity = (Math.sin(time * objData.speed + objData.timeOffset) + 1) / 2;
      const smoothIntensity = intensity * intensity; // 二次曲线让闪烁更平滑
      if (mesh.material) { 
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isFormed ? 5 + smoothIntensity * 8 : 0; 
      }
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((obj, i) => ( <mesh key={i} scale={[0.15, 0.15, 0.15]} geometry={geometry}>
          <meshStandardMaterial 
            color={obj.color} 
            emissive={obj.color} 
            emissiveIntensity={0} 
            toneMapped={false}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh> ))}
    </group>
  );
};

// --- Component: Top Star (No Photo, Pure Gold 3D Star) ---
const TopStar = ({ state }: { state: 'CHAOS' | 'FORMED' }) => {
  const groupRef = useRef<THREE.Group>(null);

  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 1.3; const innerRadius = 0.7; const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      i === 0 ? shape.moveTo(radius*Math.cos(angle), radius*Math.sin(angle)) : shape.lineTo(radius*Math.cos(angle), radius*Math.sin(angle));
    }
    shape.closePath();
    return shape;
  }, []);

  const starGeometry = useMemo(() => {
    return new THREE.ExtrudeGeometry(starShape, {
      depth: 0.4, // 增加一点厚度
      bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3,
    });
  }, [starShape]);

  // 纯金材质 - 优化渲染效果
  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: CONFIG.colors.gold,
    emissive: CONFIG.colors.gold,
    emissiveIntensity: 2.5, // 提高发光强度
    roughness: 0.05, // 更光滑的表面
    metalness: 1.0,
    envMapIntensity: 2.0, // 增强环境反射
  }), []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
      const targetScale = state === 'FORMED' ? 1 : 0;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 3);
    }
  });

  return (
    <group ref={groupRef} position={[0, CONFIG.tree.height / 2 + 1.8, 0]}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh geometry={starGeometry} material={goldMaterial} />
      </Float>
    </group>
  );
};

// --- Main Scene Experience ---
const Experience = ({ sceneState, rotationSpeed }: { sceneState: 'CHAOS' | 'FORMED', rotationSpeed: number }) => {
  const controlsRef = useRef<any>(null);
  useFrame((_, delta) => {
    if (controlsRef.current) {
      // 参考文件：当没有手势时，TREE 模式下自动旋转
      if (Math.abs(rotationSpeed) > 0.001) {
        // 有手势控制时，使用平滑插值（参考文件使用 3.0 * dt）
        const currentAngle = controlsRef.current.getAzimuthalAngle();
        const targetAngle = currentAngle + rotationSpeed * delta;
        const newAngle = currentAngle + (targetAngle - currentAngle) * Math.min(3.0 * delta, 1.0);
        controlsRef.current.setAzimuthalAngle(newAngle);
        controlsRef.current.update();
      } else if (sceneState === 'FORMED') {
        // 没有手势时，TREE 模式下自动旋转（参考文件：STATE.rotation.y += 0.3 * dt）
        controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() + 0.3 * delta);
        controlsRef.current.update();
      }
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 8, 60]} fov={50} near={0.1} far={200} />
      <OrbitControls ref={controlsRef} enablePan={false} enableZoom={true} minDistance={30} maxDistance={120} autoRotate={rotationSpeed === 0 && sceneState === 'FORMED'} autoRotateSpeed={0.3} maxPolarAngle={Math.PI / 1.7} />

      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 0.01]} />
      <Stars radius={120} depth={60} count={10000} factor={6} saturation={0.3} fade speed={1.5} />
      <Environment files="/hdri/dikhololo_night_1k.hdr" background={false} />

      <ambientLight intensity={0.6} color="#ffffff" />
      <pointLight position={[0, 5, 0]} intensity={200} color={CONFIG.colors.warmLight} distance={20} decay={2} />
      <pointLight position={[30, 40, 40]} intensity={1200} color="#ffcc66" distance={100} decay={2} />
      <pointLight position={[-30, 20, -30]} intensity={600} color="#6688ff" distance={80} decay={2} />
      <pointLight position={[0, 0, 50]} intensity={80} color="#ffeebb" distance={100} decay={2} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} color="#FFFAF0" castShadow />

      <group position={[0, -6, 0]}>
        <Foliage state={sceneState} />
        <Suspense fallback={null}>
           <PhotoOrnaments state={sceneState} />
           <ChristmasElements state={sceneState} />
           <FairyLights state={sceneState} />
           <TopStar state={sceneState} />
        </Suspense>
        <Sparkles count={1200} scale={80} size={12} speed={0.6} opacity={0.7} color={CONFIG.colors.gold} />
      </group>

      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.6} 
          luminanceSmoothing={0.95} 
          intensity={2.5} 
          radius={1.0} 
          mipmapBlur
          levels={9}
        />
        <Vignette eskil={false} offset={0.12} darkness={0.9} />
      </EffectComposer>
    </>
  );
};

// --- Gesture Controller ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GestureController = ({ onGesture, onMove, onStatus, debugMode }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let gestureRecognizer: GestureRecognizer;
    let requestRef: number;
    
    // 平滑处理参数 - 参考优化，更平滑易控制
    let lastHandX = 0.5; // 上次手部 x 坐标（归一化 0-1）
    let smoothedSpeed = 0; // 平滑后的速度
    let lastUpdateTime = Date.now();
    const SMOOTHING_FACTOR = 0.85; // 平滑系数 (提高以降低灵敏度，更平滑)
    const SPEED_MULTIPLIER = 0.4; // 速度倍数（参考文件使用 0.9，这里降低到 0.4 更易控制）
    const DEAD_ZONE = 0.2; // 死区大小（增大死区，减少误触）
    const MIN_SPEED = 0.008; // 最小速度阈值（提高阈值，减少微小抖动）
    const ROTATION_SMOOTH = 3.0; // 旋转平滑插值系数（参考文件使用 3.0）

    const setup = async () => {
      onStatus("LOADING AI...");
      try {
        // 使用本地 WASM 文件
        const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            // 使用本地模型文件
            modelAssetPath: "/mediapipe/models/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        onStatus("REQUESTING CAMERA...");
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            onStatus("AI READY: SHOW HAND");
            predictWebcam();
          }
        } else {
            onStatus("ERROR: CAMERA PERMISSION DENIED");
        }
      } catch (err: any) {
        onStatus(`ERROR: ${err.message || 'MODEL FAILED'}`);
      }
    };

    const predictWebcam = () => {
      if (gestureRecognizer && videoRef.current && canvasRef.current) {
        if (videoRef.current.videoWidth > 0) {
            const results = gestureRecognizer.recognizeForVideo(videoRef.current, Date.now());
            const ctx = canvasRef.current.getContext("2d");
            const currentTime = Date.now();
            const deltaTime = Math.max(currentTime - lastUpdateTime, 1) / 1000; // 转换为秒
            
            if (ctx && debugMode) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
                if (results.landmarks) for (const landmarks of results.landmarks) {
                        const drawingUtils = new DrawingUtils(ctx);
                        drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, { color: "#FFD700", lineWidth: 2 });
                        drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 1 });
                }
            } else if (ctx && !debugMode) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            if (results.gestures.length > 0) {
              const name = results.gestures[0][0].categoryName; const score = results.gestures[0][0].score;
              if (score > 0.4) {
                 if (name === "Open_Palm") onGesture("CHAOS"); if (name === "Closed_Fist") onGesture("FORMED");
                 if (debugMode) onStatus(`DETECTED: ${name}`);
              }
              
              if (results.landmarks.length > 0) {
                const currentHandX = results.landmarks[0][0].x; // 手腕 x 坐标（归一化 0-1）
                
                // 参考文件的计算方式：直接基于位置计算目标旋转
                // 将手部位置转换为旋转角度（参考文件使用 Math.PI * 0.9）
                const normalizedX = (currentHandX - 0.5) * 2; // 转换为 -1 到 1
                
                // 应用死区：中心区域不响应
                let targetSpeed = 0;
                if (Math.abs(normalizedX) > DEAD_ZONE) {
                  // 移除死区，然后缩放
                  const effectiveX = normalizedX > 0 
                    ? (normalizedX - DEAD_ZONE) / (1 - DEAD_ZONE)  // 右侧
                    : (normalizedX + DEAD_ZONE) / (1 - DEAD_ZONE); // 左侧
                  
                  // 参考文件使用 Math.PI * 0.9，这里转换为速度
                  // 使用更平滑的曲线
                  const curvedX = Math.sign(effectiveX) * Math.pow(Math.abs(effectiveX), 0.8);
                  targetSpeed = -curvedX * SPEED_MULTIPLIER * Math.PI * 0.9; // 参考文件的角度范围
                }
                
                // 使用平滑插值（参考文件使用 3.0 * dt 的方式）
                // 这里转换为速度插值
                smoothedSpeed += (targetSpeed - smoothedSpeed) * ROTATION_SMOOTH * deltaTime;
                
                // 应用最小速度阈值
                const finalSpeed = Math.abs(smoothedSpeed) > MIN_SPEED ? smoothedSpeed : 0;
                
                onMove(finalSpeed);
                lastHandX = currentHandX;
                lastUpdateTime = currentTime;
                
                if (debugMode) {
                  onStatus(`SPEED: ${finalSpeed.toFixed(3)} | X: ${currentHandX.toFixed(2)}`);
                }
              }
            } else { 
              // 没有检测到手势，平滑减速到0（参考文件更平滑的衰减）
              smoothedSpeed += (0 - smoothedSpeed) * ROTATION_SMOOTH * 0.016; // 使用固定帧时间
              const finalSpeed = Math.abs(smoothedSpeed) > MIN_SPEED ? smoothedSpeed : 0;
              onMove(finalSpeed);
              lastHandX = 0.5; // 重置
              if (debugMode) onStatus("AI READY: NO HAND"); 
            }
        }
        requestRef = requestAnimationFrame(predictWebcam);
      }
    };
    setup();
    return () => cancelAnimationFrame(requestRef);
  }, [onGesture, onMove, onStatus, debugMode]);

  return (
    <>
      <video ref={videoRef} style={{ opacity: debugMode ? 0.6 : 0, position: 'fixed', top: 0, right: 0, width: debugMode ? '320px' : '1px', zIndex: debugMode ? 100 : -1, pointerEvents: 'none', transform: 'scaleX(-1)' }} playsInline muted autoPlay />
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, right: 0, width: debugMode ? '320px' : '1px', height: debugMode ? 'auto' : '1px', zIndex: debugMode ? 101 : -1, pointerEvents: 'none', transform: 'scaleX(-1)' }} />
    </>
  );
};

// --- App Entry ---
export default function GrandTreeApp() {
  const [sceneState, setSceneState] = useState<'CHAOS' | 'FORMED'>('CHAOS');
  const [rotationSpeed, setRotationSpeed] = useState(0);
  const [aiStatus, setAiStatus] = useState("INITIALIZING...");
  const [debugMode, setDebugMode] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <Canvas 
          dpr={[1, Math.min(window.devicePixelRatio, 2)]} 
          gl={{ 
            toneMapping: THREE.ReinhardToneMapping,
            toneMappingExposure: 2.2,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
          }} 
          shadows
          performance={{ min: 0.5 }}
        >
            <Experience sceneState={sceneState} rotationSpeed={rotationSpeed} />
        </Canvas>
      </div>
      <GestureController onGesture={setSceneState} onMove={setRotationSpeed} onStatus={setAiStatus} debugMode={debugMode} />

      {/* UI - Stats */}
      <div style={{ position: 'absolute', bottom: '30px', left: '40px', color: '#888', zIndex: 10, fontFamily: "'Times New Roman', serif", userSelect: 'none' }}>
        <div style={{ marginBottom: '15px', background: 'rgba(20, 20, 20, 0.6)', padding: '15px 20px', borderRadius: '4px', backdropFilter: 'blur(5px)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
          <p style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '6px', color: 'rgba(212, 175, 55, 0.7)' }}>Memories</p>
          <p style={{ fontSize: '28px', color: '#d4af37', fontWeight: '400', margin: 0, textShadow: '0 0 20px rgba(212, 175, 55, 0.5)' }}>
            {CONFIG.counts.ornaments.toLocaleString()} <span style={{ fontSize: '10px', color: 'rgba(212, 175, 55, 0.5)', fontWeight: 'normal', letterSpacing: '2px' }}>POLAROIDS</span>
          </p>
        </div>
        <div style={{ background: 'rgba(20, 20, 20, 0.6)', padding: '15px 20px', borderRadius: '4px', backdropFilter: 'blur(5px)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
          <p style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '6px', color: 'rgba(212, 175, 55, 0.7)' }}>Foliage</p>
          <p style={{ fontSize: '28px', color: '#004225', fontWeight: '400', margin: 0, textShadow: '0 0 15px rgba(0, 66, 37, 0.6)' }}>
            {(CONFIG.counts.foliage / 1000).toFixed(0)}K <span style={{ fontSize: '10px', color: 'rgba(212, 175, 55, 0.5)', fontWeight: 'normal', letterSpacing: '2px' }}>EMERALD NEEDLES</span>
          </p>
        </div>
      </div>

      {/* UI - Buttons */}
      <div style={{ position: 'absolute', bottom: '30px', right: '40px', zIndex: 10, display: 'flex', gap: '12px', flexDirection: 'column' }}>
        <button 
          onClick={() => setDebugMode(!debugMode)} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: debugMode ? '#d4af37' : 'rgba(20, 20, 20, 0.6)', 
            border: '1px solid rgba(212, 175, 55, 0.4)', 
            color: debugMode ? '#000' : '#d4af37', 
            fontFamily: "'Times New Roman', serif", 
            fontSize: '10px', 
            fontWeight: '400', 
            letterSpacing: '3px',
            textTransform: 'uppercase',
            cursor: 'pointer', 
            backdropFilter: 'blur(5px)',
            transition: 'all 0.4s',
            boxShadow: debugMode ? '0 0 20px rgba(212, 175, 55, 0.5)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!debugMode) {
              e.currentTarget.style.background = '#d4af37';
              e.currentTarget.style.color = '#000';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!debugMode) {
              e.currentTarget.style.background = 'rgba(20, 20, 20, 0.6)';
              e.currentTarget.style.color = '#d4af37';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
           {debugMode ? 'HIDE DEBUG' : '🛠 DEBUG'}
        </button>
        <button 
          onClick={() => setSceneState(s => s === 'CHAOS' ? 'FORMED' : 'CHAOS')} 
          style={{ 
            padding: '12px 30px', 
            backgroundColor: 'rgba(20, 20, 20, 0.6)', 
            border: '1px solid rgba(212, 175, 55, 0.4)', 
            color: '#d4af37', 
            fontFamily: "'Times New Roman', serif", 
            fontSize: '12px', 
            fontWeight: '400', 
            letterSpacing: '4px', 
            textTransform: 'uppercase', 
            cursor: 'pointer', 
            backdropFilter: 'blur(5px)',
            transition: 'all 0.4s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#d4af37';
            e.currentTarget.style.color = '#000';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(20, 20, 20, 0.6)';
            e.currentTarget.style.color = '#d4af37';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
           {sceneState === 'CHAOS' ? 'Assemble Tree' : 'Disperse'}
        </button>
      </div>

      {/* UI - AI Status */}
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        color: aiStatus.includes('ERROR') ? '#ff0000' : 'rgba(212, 175, 55, 0.6)', 
        fontSize: '9px', 
        letterSpacing: '3px', 
        textTransform: 'uppercase',
        zIndex: 10, 
        background: 'rgba(20, 20, 20, 0.6)', 
        padding: '6px 12px', 
        borderRadius: '2px',
        backdropFilter: 'blur(5px)',
        border: '1px solid rgba(212, 175, 55, 0.2)',
        fontFamily: "'Times New Roman', serif",
        fontWeight: '100'
      }}>
        {aiStatus}
      </div>
    </div>
  );
}