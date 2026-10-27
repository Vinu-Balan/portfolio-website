import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
} from 'three';
import { ATMOSPHERE, PALETTE } from '../config';
import embersFrag from '../shaders/embers.frag?raw';
import embersVert from '../shaders/embers.vert?raw';
import type { Random } from '../utils/random';

export interface Embers {
  readonly points: Points;
  update(elapsed: number): void;
  setCount(count: number): void;
  setPixelRatio(ratio: number): void;
}

/**
 * Campfire embers. Motion is computed in the vertex shader from time and a per-particle
 * seed, so the CPU never touches particle positions after creation.
 */
export function createEmbers(capacity: number, random: Random): Embers {
  const seeds = new Float32Array(capacity);
  for (let i = 0; i < capacity; i++) seeds[i] = random();
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(capacity * 3), 3));
  geometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
  const uniforms = {
    uTime: { value: 0 },
    uRise: { value: ATMOSPHERE.emberRiseSpeed },
    uSpread: { value: ATMOSPHERE.emberSpread },
    uMaxHeight: { value: ATMOSPHERE.emberMaxHeight },
    uPixelRatio: { value: 1 },
    uColor: { value: new Color(PALETTE.ember) },
  };
  const material = new ShaderMaterial({
    vertexShader: embersVert,
    fragmentShader: embersFrag,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.name = 'embers';
  return {
    points,
    update: (elapsed) => {
      uniforms.uTime.value = elapsed;
    },
    setCount: (count) => {
      geometry.setDrawRange(0, Math.min(capacity, count));
    },
    setPixelRatio: (ratio) => {
      uniforms.uPixelRatio.value = ratio;
    },
  };
}
