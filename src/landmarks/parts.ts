import { Group, type Mesh } from 'three';
import { PALETTE } from '../config';
import { box, cylinder, gableRoof } from '../scene/materials';

/** Packed-dirt pad that hides terrain unevenness under a building. */
export function dirtPad(radius: number): Mesh {
  const pad = cylinder(
    radius,
    radius + 0.6,
    2,
    PALETTE.sand,
    { position: [0, -1.95, 0], castShadow: false },
    10,
  );
  return pad;
}

/** Plank building: walls, gable roof and a door on the +Z face. */
export function cabin(
  width: number,
  height: number,
  depth: number,
  wallColor: number = PALETTE.wood,
): Group {
  const group = new Group();
  group.add(
    box([width, height, depth], wallColor),
    gableRoof(width + 0.8, depth + 0.8, height * 0.45, PALETTE.roof, { position: [0, height, 0] }),
    box([1.2, 2.2, 0.15], PALETTE.woodDark, { position: [0, 0, depth / 2 + 0.05] }),
  );
  return group;
}

/** Simple vertical post; used for porches, fences and poles. */
export function post(
  height: number,
  x: number,
  z: number,
  radius = 0.15,
  color: number = PALETTE.woodDark,
): Mesh {
  return cylinder(radius, radius, height, color, { position: [x, 0, z] }, 5);
}

/** Pair of windows on the front wall of a building. */
export function windows(width: number, y: number, z: number): Mesh[] {
  const offset = width * 0.3;
  return [-offset, offset].map((x) =>
    box([1, 1, 0.12], PALETTE.woodDark, { position: [x, y, z], castShadow: false }),
  );
}
