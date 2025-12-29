import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { CONFIG } from '../config';

export const FoliageMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color(CONFIG.colors.emerald), uProgress: 0 },
  `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aTargetPos;
    attribute float aRandom;
    varying vec2 vUv;
    varying float vMix;
    float cubicInOut(float t) {
      return t < 0.5 ? 4.0 * t * t * t : 0.5 * pow(2.0 * t - 2.0, 3.0) + 1.0;
    }
    void main() {
      vUv = uv;
      vec3 noise = vec3(
        sin(uTime * 1.5 + position.x),
        cos(uTime + position.y),
        sin(uTime * 1.5 + position.z)
      ) * 0.15;
      float t = cubicInOut(uProgress);
      vec3 finalPos = mix(position, aTargetPos + noise, t);
      vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
      gl_PointSize = (60.0 * (1.0 + aRandom)) / -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
      vMix = t;
    }
  `,
  `
    uniform vec3 uColor;
    varying float vMix;
    void main() {
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;
      float smoothEdge = 1.0 - smoothstep(0.3, 0.5, r);
      vec3 finalColor = mix(uColor * 0.4, uColor * 1.5, vMix) * smoothEdge;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ FoliageMaterial });

