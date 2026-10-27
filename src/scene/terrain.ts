import { BufferAttribute, Color, Mesh, PlaneGeometry } from 'three';
import { PALETTE, WORLD } from '../config';
import { smoothstep } from '../utils/math';
import { fbm } from '../utils/random';
import { flatMaterial } from './materials';

export type HeightFn = (x: number, z: number) => number;

const DETAIL_SCALE = 0.02;
const RIDGE_SCALE = 0.012;
const DETAIL_HEIGHT = 4;
const MOUNTAIN_RAMP = 90;
const SAGE_THRESHOLD = 0.55;
const ROCK_HEIGHT = 9;

/** Valley floor with gentle noise, rising into a jagged mountain rim. */
export function createHeightFn(seed: number = WORLD.seed): HeightFn {
  return (x, z) => {
    const r = Math.hypot(x, z);
    const detail = (fbm(x * DETAIL_SCALE, z * DETAIL_SCALE, seed) - 0.5) * DETAIL_HEIGHT;
    const rim = smoothstep(WORLD.valleyRadius, WORLD.valleyRadius + MOUNTAIN_RAMP, r);
    const ridge = 0.6 + 0.8 * fbm(x * RIDGE_SCALE, z * RIDGE_SCALE, seed + 7, 5);
    return detail + rim * WORLD.mountainHeight * ridge;
  };
}

function colorFor(height: number, x: number, z: number, out: Color): Color {
  const sand = new Color(PALETTE.sand);
  if (height > ROCK_HEIGHT)
    return out
      .copy(sand)
      .lerp(new Color(PALETTE.rock), smoothstep(ROCK_HEIGHT, ROCK_HEIGHT * 3, height));
  const patch = fbm(x * 0.05, z * 0.05, WORLD.seed + 3);
  return out
    .copy(sand)
    .lerp(new Color(PALETTE.sage), smoothstep(SAGE_THRESHOLD - 0.1, SAGE_THRESHOLD + 0.1, patch));
}

/** Low-poly terrain mesh with height-based vertex colours. */
export function createTerrain(heightAt: HeightFn): Mesh {
  const geometry = new PlaneGeometry(
    WORLD.terrainSize,
    WORLD.terrainSize,
    WORLD.terrainSegments,
    WORLD.terrainSegments,
  );
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  const color = new Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const y = heightAt(x, z);
    positions.setY(i, y);
    colorFor(y, x, z, color).toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const material = flatMaterial(0xffffff).clone();
  material.vertexColors = true;
  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  return mesh;
}
