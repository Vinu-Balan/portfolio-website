import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector3,
  type InstancedMesh,
} from 'three';
import { ATMOSPHERE, PALETTE } from '../config';
import grassFrag from '../shaders/grass.frag?raw';
import grassVert from '../shaders/grass.vert?raw';
import { range, type Random } from '../utils/random';
import { createInstancedField } from './instancedField';
import type { HeightFn } from './terrain';

const BLADE_WIDTH = 0.07;
const BLADES_PER_CLUMP = 3;
const CLUMP_JITTER = 0.18;
const MAX_GRASS_ALTITUDE = 7;

/** One clump: three tapered blades fanned around the Y axis. Height is normalised to 1. */
function createClumpGeometry(): BufferGeometry {
  const positions: number[] = [];
  for (let b = 0; b < BLADES_PER_CLUMP; b++) {
    const angle = (b / BLADES_PER_CLUMP) * Math.PI;
    const ox = Math.cos(angle * 2.3) * CLUMP_JITTER;
    const oz = Math.sin(angle * 2.3) * CLUMP_JITTER;
    const dx = Math.cos(angle) * BLADE_WIDTH;
    const dz = Math.sin(angle) * BLADE_WIDTH;
    const v = (s: number, y: number): number[] => [ox + dx * s, y, oz + dz * s];
    positions.push(...v(-1, 0), ...v(1, 0), ...v(-0.6, 0.5));
    positions.push(...v(1, 0), ...v(0.6, 0.5), ...v(-0.6, 0.5));
    positions.push(...v(-0.6, 0.5), ...v(0.6, 0.5), ...v(0, 1));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geometry;
}

export interface Grass {
  readonly mesh: InstancedMesh;
  update(elapsed: number, tint: Color): void;
}

/** Wind-swept grass: instanced clumps animated entirely in the vertex shader. */
export function createGrass(
  heightAt: HeightFn,
  random: Random,
  capacity: number,
  isClear: (x: number, z: number) => boolean,
): Grass {
  const time = { value: 0 };
  const light = { value: new Color(1, 1, 1) };
  // merge() clones uniforms, so the live time/light objects are assigned after merging.
  const uniforms = {
    ...UniformsUtils.merge([
      UniformsLib.fog,
      {
        uWind: { value: ATMOSPHERE.windStrength },
        uBase: { value: new Color(PALETTE.grassBase) },
        uTip: { value: new Color(PALETTE.grassTip) },
      },
    ]),
    uTime: time,
    uLight: light,
  };
  const material = new ShaderMaterial({
    vertexShader: grassVert,
    fragmentShader: grassFrag,
    uniforms,
    side: DoubleSide,
    fog: true,
  });
  const mesh = createInstancedField(createClumpGeometry(), material, capacity, () => {
    const radius = Math.sqrt(random()) * ATMOSPHERE.grassFieldRadius;
    const angle = random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = heightAt(x, z);
    if (y > MAX_GRASS_ALTITUDE || !isClear(x, z)) return null;
    return {
      position: new Vector3(x, y, z),
      rotationY: random() * Math.PI * 2,
      scale: range(random, 0.6, 1.4) * ATMOSPHERE.grassBladeHeight,
    };
  });
  mesh.name = 'grass';
  mesh.frustumCulled = false;
  return {
    mesh,
    update: (elapsed, tint) => {
      time.value = elapsed;
      light.value.copy(tint);
    },
  };
}
