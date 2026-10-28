import { Group, Vector3, type Object3D } from 'three';
import { RIDER } from '../config';
import { box, cone, cylinder } from './materials';
import type { HeightFn } from './terrain';

/**
 * The player's avatar: an original low-poly cowboy on horseback, built procedurally
 * (dark flat-brim hat, long duster coat, red neckerchief, bay horse). It travels to
 * whichever landmark is selected. Model faces +Z; legs pivot at the hip so they can swing.
 */

const COLORS = {
  horse: 0x6b3f22,
  horseDark: 0x2e1c12,
  hoof: 0x1d1410,
  coat: 0x3b2a1e,
  shirt: 0x8c7a5c,
  trousers: 0x2f2a26,
  skin: 0xc58c64,
  hat: 0x2a1d15,
  neckerchief: 0x9a2a1c,
  leather: 0x5a3a22,
} as const;

/** A limb whose geometry hangs below its pivot, so rotation.x swings it like a hip. */
function leg(x: number, z: number, length: number, color: number): Group {
  const pivot = new Group();
  pivot.position.set(x, 0, z);
  const shank = box([0.2, length, 0.22], color, { position: [0, -length, 0] });
  const hoof = box([0.24, 0.16, 0.28], COLORS.hoof, { position: [0, -length - 0.08, 0.02] });
  pivot.add(shank, hoof);
  return pivot;
}

// Positions below are mesh *bases* (see box/cone/cylinder in materials.ts), in torso space.
function horseBody(): Group {
  const body = new Group();
  body.add(
    box([0.95, 0.9, 2.3], COLORS.horse, { position: [0, -0.45, 0] }),
    box([0.5, 1.1, 0.55], COLORS.horse, { position: [0, 0.1, 1.05], rotation: [0.6, 0, 0] }),
    box([0.12, 0.95, 0.4], COLORS.horseDark, { position: [0, 0.25, 0.85], rotation: [0.6, 0, 0] }),
    box([0.42, 0.45, 0.95], COLORS.horse, { position: [0, 0.85, 1.75], rotation: [0.35, 0, 0] }),
    cone(0.1, 0.25, COLORS.horseDark, { position: [0.13, 1.25, 1.45] }, 4),
    cone(0.1, 0.25, COLORS.horseDark, { position: [-0.13, 1.25, 1.45] }, 4),
    cone(0.16, 1.1, COLORS.horseDark, { position: [0, 0.3, -1.15], rotation: [-2.4, 0, 0] }, 5),
    box([1.0, 0.18, 0.9], COLORS.leather, { position: [0, 0.42, 0.05] }),
  );
  return body;
}

function cowboy(): Group {
  const rider = new Group();
  rider.position.set(0, 0.55, 0);
  rider.add(
    box([0.72, 0.55, 0.5], COLORS.coat, { position: [0, 0, -0.04] }),
    box([0.62, 0.8, 0.4], COLORS.coat, { position: [0, 0.4, 0] }),
    box([0.36, 0.45, 0.05], COLORS.shirt, { position: [0, 0.7, 0.19] }),
    box([0.32, 0.12, 0.32], COLORS.neckerchief, { position: [0, 1.15, 0.02] }),
    box([0.3, 0.34, 0.3], COLORS.skin, { position: [0, 1.22, 0] }),
    cylinder(0.46, 0.46, 0.05, COLORS.hat, { position: [0, 1.5, 0] }, 12),
    cylinder(0.2, 0.24, 0.3, COLORS.hat, { position: [0, 1.52, 0] }, 8),
    box([0.16, 0.6, 0.18], COLORS.coat, { position: [0.34, 0.65, 0.4], rotation: [-0.54, 0, 0] }),
    box([0.16, 0.6, 0.18], COLORS.coat, { position: [-0.34, 0.65, 0.4], rotation: [-0.54, 0, 0] }),
    box([0.18, 0.7, 0.22], COLORS.trousers, {
      position: [0.55, -0.6, 0.12],
      rotation: [0, 0, 0.18],
    }),
    box([0.18, 0.7, 0.22], COLORS.trousers, {
      position: [-0.55, -0.6, 0.12],
      rotation: [0, 0, -0.18],
    }),
  );
  return rider;
}

/** Torso sits so the barrel overlaps the top of the legs. */
const TORSO_Y = RIDER.legLength + 0.35;

interface Model {
  readonly root: Group;
  readonly torso: Group;
  readonly legs: readonly Group[];
}

function buildModel(): Model {
  const root = new Group();
  root.name = 'rider';
  const torso = new Group();
  torso.position.y = TORSO_Y;
  const legs = [
    leg(0.32, 0.85, RIDER.legLength, COLORS.horse),
    leg(-0.32, 0.85, RIDER.legLength, COLORS.horse),
    leg(0.32, -0.85, RIDER.legLength, COLORS.horse),
    leg(-0.32, -0.85, RIDER.legLength, COLORS.horse),
  ];
  legs.forEach((l) => {
    l.position.y = RIDER.legLength + 0.1;
  });
  torso.add(horseBody(), cowboy());
  root.add(torso, ...legs);
  root.scale.setScalar(RIDER.scale);
  root.traverse((child: Object3D) => {
    child.castShadow = true;
  });
  return { root, torso, legs };
}

export interface Rider {
  readonly group: Group;
  /** Ride to `target` (y ignored; follows the terrain). Resolves on arrival. */
  travelTo(target: Vector3, facing: Vector3, instant: boolean): Promise<void>;
  update(elapsed: number): void;
}

/** Gait: diagonal leg pairs swing together while moving; a gentle breathing bob at rest. */
function animateModel(model: Model, stride: number | null, elapsed: number): void {
  const swing = stride === null ? 0 : Math.sin(stride) * RIDER.legSwing;
  model.legs.forEach((l, i) => {
    l.rotation.x = i === 0 || i === 3 ? swing : -swing;
  });
  const bob =
    stride === null ? Math.sin(elapsed * 1.6) * 0.02 : Math.abs(Math.sin(stride)) * RIDER.bob;
  model.torso.position.y = TORSO_Y + bob;
}

function shortestAngle(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/** Create the rider and place it at `start`, facing `facing`. */
export function createRider(heightAt: HeightFn, start: Vector3, facing: Vector3): Rider {
  const model = buildModel();
  const position = start.clone();
  const destination = start.clone();
  const lookAt = facing.clone();
  let heading = Math.atan2(facing.x - start.x, facing.z - start.z);
  let stride = 0;
  let lastElapsed = 0;
  let arrive: (() => void) | null = null;

  const place = (): void => {
    model.root.position.set(position.x, heightAt(position.x, position.z), position.z);
    model.root.rotation.y = heading;
  };

  const step = (delta: number, elapsed: number): void => {
    const toTarget = destination.clone().sub(position).setY(0);
    const distance = toTarget.length();
    const moving = distance > RIDER.arriveDistance;
    const desired = moving
      ? Math.atan2(toTarget.x, toTarget.z)
      : Math.atan2(lookAt.x - position.x, lookAt.z - position.z);
    heading += shortestAngle(heading, desired) * Math.min(1, delta * RIDER.turnRate);
    if (moving) {
      const travel = Math.min(distance, RIDER.speed * delta);
      position.addScaledVector(toTarget.normalize(), travel);
      stride += travel * RIDER.strideFrequency;
    } else if (arrive) {
      arrive();
      arrive = null;
    }
    animateModel(model, moving ? stride : null, elapsed);
    place();
  };

  place();
  return {
    group: model.root,
    travelTo: (target, facingPoint, instant) => {
      arrive?.();
      destination.set(target.x, 0, target.z);
      lookAt.copy(facingPoint);
      if (instant) {
        position.copy(destination);
        heading = Math.atan2(lookAt.x - position.x, lookAt.z - position.z);
        place();
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        arrive = resolve;
      });
    },
    update: (elapsed) => {
      const delta = Math.max(0, Math.min(0.1, elapsed - lastElapsed));
      lastElapsed = elapsed;
      step(delta, elapsed);
    },
  };
}
