import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../config';
import type { SceneState } from '../config';

function ChristmasElements({ state }: { state: SceneState }) {
  const count = CONFIG.counts.elements;
  const boxRef = useRef<THREE.InstancedMesh>(null!);
  const sphereRef = useRef<THREE.InstancedMesh>(null!);
  const caneRef = useRef<THREE.InstancedMesh>(null!);

  const boxGeometry = useMemo(() => new THREE.BoxGeometry(0.8, 0.8, 0.8), []);
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.5, 16, 16), []);
  const caneGeometry = useMemo(() => new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8), []);

  const { boxes, spheres, canes } = useMemo(() => {
    const boxes: any[] = [];
    const spheres: any[] = [];
    const canes: any[] = [];
    for (let i = 0; i < count; i++) {
      const chaosPos = new THREE.Vector3((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60);
      const h = CONFIG.tree.height;
      const y = Math.random() * h - h / 2;
      const rBase = CONFIG.tree.radius;
      const currentRadius = (rBase * (1 - (y + h / 2) / h)) * 0.95;
      const theta = Math.random() * Math.PI * 2;
      const targetPos = new THREE.Vector3(currentRadius * Math.cos(theta), y, currentRadius * Math.sin(theta));

      const type = Math.floor(Math.random() * 3);
      let color;
      let scale = 1;
      const rotationSpeed = { x: (Math.random() - 0.5) * 2.0, y: (Math.random() - 0.5) * 2.0, z: (Math.random() - 0.5) * 2.0 };
      const data = { chaosPos, targetPos, scale, color, currentPos: chaosPos.clone(), rotation: new THREE.Euler(0, 0, 0), rotationSpeed };

      if (type === 0) {
        data.color = CONFIG.colors.giftColors[Math.floor(Math.random() * CONFIG.colors.giftColors.length)];
        data.scale = 0.8 + Math.random() * 0.4;
        boxes.push(data);
      } else if (type === 1) {
        data.color = CONFIG.colors.giftColors[Math.floor(Math.random() * CONFIG.colors.giftColors.length)];
        data.scale = 0.6 + Math.random() * 0.4;
        spheres.push(data);
      } else {
        data.color = Math.random() > 0.5 ? CONFIG.colors.red : CONFIG.colors.white;
        data.scale = 0.7 + Math.random() * 0.3;
        canes.push(data);
      }
    }
    return { boxes, spheres, canes };
  }, [count]);

  useFrame((_, delta) => {
    const isFormed = state === 'FORMED';
    const dummy = new THREE.Object3D();

    const updateInstances = (meshRef: React.RefObject<THREE.InstancedMesh>, items: any[]) => {
      if (!meshRef.current) return;
      for (let i = 0; i < items.length; i++) {
        const objData = items[i];
        const target = isFormed ? objData.targetPos : objData.chaosPos;
        objData.currentPos.lerp(target, delta * 1.5);
        dummy.position.copy(objData.currentPos);
        objData.rotation.x += delta * objData.rotationSpeed.x;
        objData.rotation.y += delta * objData.rotationSpeed.y;
        objData.rotation.z += delta * objData.rotationSpeed.z;
        dummy.rotation.copy(objData.rotation);
        dummy.scale.set(objData.scale, objData.scale, objData.scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, new THREE.Color(objData.color));
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      if ((meshRef.current as any).instanceColor) {
        (meshRef.current as any).instanceColor.needsUpdate = true;
      }
    };

    updateInstances(boxRef, boxes);
    updateInstances(sphereRef, spheres);
    updateInstances(caneRef, canes);
  });

  const material = (
    <meshStandardMaterial
      roughness={0.2}
      metalness={0.5}
      emissiveIntensity={0.3}
      envMapIntensity={1.2}
    />
  );

  return (
    <group>
      <instancedMesh ref={boxRef} args={[boxGeometry as any, undefined as any, boxes.length]}>
        {material}
      </instancedMesh>
      <instancedMesh ref={sphereRef} args={[sphereGeometry as any, undefined as any, spheres.length]}>
        {material}
      </instancedMesh>
      <instancedMesh ref={caneRef} args={[caneGeometry as any, undefined as any, canes.length]}>
        {material}
      </instancedMesh>
    </group>
  );
}

export default memo(ChristmasElements);
