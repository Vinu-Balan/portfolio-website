import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { ATMOSPHERE, PALETTE } from '../config';
import type { Random } from '../utils/random';
import type { HeightFn } from './terrain';

const BRANCH_COUNT = 70;
const PATH_HALF_LENGTH = 60;
const BOUNCE_HEIGHT = 0.6;
const BOUNCE_FREQUENCY = 2.4;

export interface Tumbleweed {
  readonly group: Group;
  /** World position for the DOM hotspot; null while off-stage. */
  readonly anchor: () => Vector3 | null;
  update(elapsed: number): void;
}

/** A tangle of random chords inside a sphere reads as dry brush from any angle. */
function createBrush(random: Random): LineSegments {
  const points: number[] = [];
  const r = ATMOSPHERE.tumbleweedRadius;
  const randomPoint = (): number[] => {
    const v = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
    return v.multiplyScalar(r * (0.6 + random() * 0.4)).toArray();
  };
  for (let i = 0; i < BRANCH_COUNT; i++) points.push(...randomPoint(), ...randomPoint());
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  return new LineSegments(geometry, new LineBasicMaterial({ color: PALETTE.woodDark }));
}

/** Invisible, slightly larger sphere so the thin lines are easy to click or tap. */
function createHitArea(): Mesh {
  const hit = new Mesh(
    new SphereGeometry(ATMOSPHERE.tumbleweedRadius * 1.6, 8, 6),
    new MeshBasicMaterial({ visible: false }),
  );
  return hit;
}

/**
 * Easter-egg tumbleweed: rolls across the valley once per interval. Clicking it is
 * handled by the world via userData.pickId.
 */
export function createTumbleweed(heightAt: HeightFn, random: Random): Tumbleweed {
  const group = new Group();
  const ball = new Group();
  ball.add(createBrush(random), createHitArea());
  group.add(ball);
  group.userData.pickId = 'tumbleweed';
  group.visible = false;
  const start = new Vector3(-PATH_HALF_LENGTH, 0, 12);
  const end = new Vector3(PATH_HALF_LENGTH, 0, -6);
  let visible = false;

  const update = (elapsed: number): void => {
    const cycle = elapsed % ATMOSPHERE.tumbleweedIntervalSec;
    visible = cycle < ATMOSPHERE.tumbleweedDurationSec;
    group.visible = visible;
    if (!visible) return;
    const t = cycle / ATMOSPHERE.tumbleweedDurationSec;
    group.position.lerpVectors(start, end, t);
    const bounce = Math.abs(Math.sin(t * Math.PI * 2 * BOUNCE_FREQUENCY)) * BOUNCE_HEIGHT;
    group.position.y =
      heightAt(group.position.x, group.position.z) + ATMOSPHERE.tumbleweedRadius + bounce;
    ball.rotation.z = (-t * PATH_HALF_LENGTH * 2) / ATMOSPHERE.tumbleweedRadius;
  };

  return { group, anchor: () => (visible ? group.position : null), update };
}
