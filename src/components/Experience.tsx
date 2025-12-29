import { memo, Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CONFIG } from '../config';
import type { SceneState } from '../config';
import Foliage from './Foliage';
import PhotoOrnaments from './PhotoOrnaments';
import ChristmasElements from './ChristmasElements';
import FairyLights from './FairyLights';
import TopStar from './TopStar';

function Experience({ sceneState, rotationSpeed }: { sceneState: SceneState; rotationSpeed: number }) {
  const controlsRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (controlsRef.current) {
      if (Math.abs(rotationSpeed) > 0.001) {
        const currentAngle = controlsRef.current.getAzimuthalAngle();
        const targetAngle = currentAngle + rotationSpeed * delta;
        const newAngle = currentAngle + (targetAngle - currentAngle) * Math.min(3.0 * delta, 1.0);
        controlsRef.current.setAzimuthalAngle(newAngle);
        controlsRef.current.update();
      } else if (sceneState === 'FORMED') {
        controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() + 0.3 * delta);
        controlsRef.current.update();
      }
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 8, 60]} fov={50} near={0.1} far={200} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={30}
        maxDistance={120}
        autoRotate={rotationSpeed === 0 && sceneState === 'FORMED'}
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.7}
      />
      <color attach="background" args={['#000300']} />
      <Stars radius={120} depth={60} count={8000} factor={5} saturation={0.2} fade speed={1.2} />
      <Environment files="/hdri/dikhololo_night_1k.hdr" background={false} />
      <ambientLight intensity={0.5} color="#003311" />
      <pointLight position={[30, 30, 30]} intensity={120} color={CONFIG.colors.warmLight} distance={100} decay={2} />
      <pointLight position={[-30, 10, -30]} intensity={70} color={CONFIG.colors.gold} distance={80} decay={2} />
      <pointLight position={[0, -20, 10]} intensity={40} color="#ffffff" distance={60} decay={2} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} color="#FFFAF0" castShadow />
      <group position={[0, -6, 0]}>
        <Foliage state={sceneState} />
        <Suspense fallback={null}>
          <PhotoOrnaments state={sceneState} />
          <ChristmasElements state={sceneState} />
          <FairyLights state={sceneState} />
          <TopStar state={sceneState} />
        </Suspense>
        <Sparkles count={800} scale={60} size={10} speed={0.5} opacity={0.5} color={CONFIG.colors.silver} />
      </group>
      <EffectComposer>
        <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.9} intensity={2.0} radius={0.8} mipmapBlur levels={9} />
        <Vignette eskil={false} offset={0.15} darkness={0.8} />
      </EffectComposer>
    </>
  );
}

export default memo(Experience);
