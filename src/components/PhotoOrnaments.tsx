import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { CONFIG } from '../config';
import type { SceneState } from '../config';

function PhotoOrnaments({ state }: { state: SceneState }) {
  const textures = useTexture(CONFIG.photos.body);
  const count = CONFIG.counts.ornaments;
  const groupRef = useRef<THREE.Group>(null);

  const borderGeometry = useMemo(() => new THREE.PlaneGeometry(1.2, 1.5), []);
  const photoGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const chaosPos = new THREE.Vector3((Math.random() - 0.5) * 70, (Math.random() - 0.5) * 70, (Math.random() - 0.5) * 70);
      const h = CONFIG.tree.height;
      const y = Math.random() * h - h / 2;
      const rBase = CONFIG.tree.radius;
      const currentRadius = rBase * (1 - (y + h / 2) / h) + 0.5;
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
      const chaosRotation = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      return {
        chaosPos,
        targetPos,
        scale: baseScale,
        weight,
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
      const objData = (data as any)[i];
      const target = isFormed ? objData.targetPos : objData.chaosPos;

      objData.currentPos.lerp(target, delta * (isFormed ? 0.8 * objData.weight : 0.5));
      (group as any).position.copy(objData.currentPos);

      if (isFormed) {
        const targetLookPos = new THREE.Vector3((group as any).position.x * 2, (group as any).position.y + 0.5, (group as any).position.z * 2);
        (group as any).lookAt(targetLookPos);

        const wobbleX = Math.sin(time * objData.wobbleSpeed + objData.wobbleOffset) * 0.05;
        const wobbleZ = Math.cos(time * objData.wobbleSpeed * 0.8 + objData.wobbleOffset) * 0.05;
        (group as any).rotation.x += wobbleX;
        (group as any).rotation.z += wobbleZ;
      } else {
        (group as any).rotation.x += delta * objData.rotationSpeed.x;
        (group as any).rotation.y += delta * objData.rotationSpeed.y;
        (group as any).rotation.z += delta * objData.rotationSpeed.z;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {(data as any[]).map((obj, i) => (
        <group key={i} scale={[obj.scale, obj.scale, obj.scale]} rotation={state === 'CHAOS' ? obj.chaosRotation : [0, 0, 0]}>
          <group position={[0, 0, 0.015]}>
            <mesh geometry={photoGeometry}>
              <meshStandardMaterial
                map={textures[obj.textureIndex]}
                roughness={0.3}
                metalness={0.1}
                emissive={CONFIG.colors.white}
                emissiveMap={textures[obj.textureIndex]}
                emissiveIntensity={1.2}
                side={THREE.FrontSide}
                envMapIntensity={1.0}
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
          <group position={[0, 0, -0.015]} rotation={[0, Math.PI, 0]}>
            <mesh geometry={photoGeometry}>
              <meshStandardMaterial
                map={textures[obj.textureIndex]}
                roughness={0.3}
                metalness={0.1}
                emissive={CONFIG.colors.white}
                emissiveMap={textures[obj.textureIndex]}
                emissiveIntensity={1.2}
                side={THREE.FrontSide}
                envMapIntensity={1.0}
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
}

export default memo(PhotoOrnaments);
