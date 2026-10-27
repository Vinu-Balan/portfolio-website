import {
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  Vector3,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PALETTE, WORLD } from '../config';
import { range, type Random } from '../utils/random';
import { createInstancedField } from './instancedField';
import { flatMaterial } from './materials';
import type { HeightFn } from './terrain';

const ROCK_COUNT = 90;
const CACTUS_COUNT = 40;
const DECOR_MIN_RADIUS = 12;
const DECOR_MAX_RADIUS = 85;

export type ClearanceFn = (x: number, z: number) => boolean;

/** Distant peaks: big low-poly cones lost in fog give a layered silhouette at dusk. */
function createMountains(heightAt: HeightFn, random: Random): Group {
  const group = new Group();
  const geometry = new ConeGeometry(1, 1, 5);
  geometry.translate(0, 0.5, 0);
  const field = createInstancedField(
    geometry,
    flatMaterial(PALETTE.mountain),
    WORLD.mountainCount,
    (i) => {
      const angle = (i / WORLD.mountainCount) * Math.PI * 2 + range(random, -0.08, 0.08);
      const radius = WORLD.mountainRingRadius + range(random, -15, 25);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return {
        position: new Vector3(x, heightAt(x, z) - 4, z),
        rotationY: random() * Math.PI,
        scale: range(random, 30, 60),
      };
    },
  );
  field.castShadow = false;
  group.add(field);
  return group;
}

function scatter(heightAt: HeightFn, random: Random, isClear: ClearanceFn, sink: number) {
  return (): { position: Vector3; rotationY: number; scale: number } | null => {
    const radius = range(random, DECOR_MIN_RADIUS, DECOR_MAX_RADIUS);
    const angle = random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (!isClear(x, z)) return null;
    return {
      position: new Vector3(x, heightAt(x, z) - sink, z),
      rotationY: random() * Math.PI * 2,
      scale: range(random, 0.6, 1.8),
    };
  };
}

function cactusPart(
  radius: number,
  height: number,
  x: number,
  y: number,
  horizontal: boolean,
): CylinderGeometry {
  const part = new CylinderGeometry(radius, radius, height, 6);
  if (horizontal) part.rotateZ(Math.PI / 2);
  part.translate(x, y, 0);
  return part;
}

/** Saguaro-style cactus: trunk plus two arms merged into one geometry for instancing. */
function cactusGeometry(): BufferGeometry {
  const parts = [
    cactusPart(0.4, 4.2, 0, 2.1, false),
    cactusPart(0.22, 0.9, 0.6, 1.8, true),
    cactusPart(0.24, 1.3, 1.0, 2.4, false),
    cactusPart(0.2, 0.7, -0.5, 2.6, true),
    cactusPart(0.22, 1.0, -0.8, 3.05, false),
  ];
  const merged = mergeGeometries(parts);
  parts.forEach((part) => {
    part.dispose();
  });
  return merged;
}

/** Mountains, rocks and cacti. Everything is instanced so decor costs three draw calls. */
export function createEnvironment(heightAt: HeightFn, random: Random, isClear: ClearanceFn): Group {
  const group = new Group();
  group.name = 'environment';
  group.add(createMountains(heightAt, random));
  const rocks = createInstancedField(
    new DodecahedronGeometry(1, 0),
    flatMaterial(PALETTE.rock),
    ROCK_COUNT,
    scatter(heightAt, random, isClear, 0.3),
  );
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  const cacti = createInstancedField(
    cactusGeometry(),
    flatMaterial(PALETTE.grassBase),
    CACTUS_COUNT,
    scatter(heightAt, random, isClear, 0.1),
  );
  cacti.castShadow = true;
  group.add(rocks, cacti);
  return group;
}
