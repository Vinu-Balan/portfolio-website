import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
} from 'three';
import { PALETTE } from '../config';
import { box } from '../scene/materials';
import type { LandmarkBuild, LandmarkSpec } from './Landmark';
import { cabin, dirtPad, post, windows } from './parts';

const POLE_COUNT = 3;
const POLE_SPACING = 7;
const POLE_HEIGHT = 6;
const WIRE_SAG = 0.6;
const WIRE_SEGMENTS = 8;
const CROSSARM_OFFSETS = [-0.6, 0.6] as const;

function poleX(index: number): number {
  return 5 + index * POLE_SPACING;
}

function poles(): Group {
  const group = new Group();
  for (let i = 0; i < POLE_COUNT; i++) {
    const x = poleX(i);
    group.add(
      post(POLE_HEIGHT, x, -2, 0.16),
      box([1.8, 0.14, 0.14], PALETTE.woodDark, { position: [x, POLE_HEIGHT - 0.6, -2] }),
    );
  }
  return group;
}

/** Wires drawn as sagging catenary-ish arcs between consecutive poles. */
function wires(): LineSegments {
  const points: number[] = [];
  const y = POLE_HEIGHT - 0.5;
  for (let i = 0; i < POLE_COUNT - 1; i++) {
    for (const dz of CROSSARM_OFFSETS) {
      for (let s = 0; s < WIRE_SEGMENTS; s++) {
        const t0 = s / WIRE_SEGMENTS;
        const t1 = (s + 1) / WIRE_SEGMENTS;
        const x0 = poleX(i) + t0 * POLE_SPACING;
        const x1 = poleX(i) + t1 * POLE_SPACING;
        const sag = (t: number): number => y - Math.sin(t * Math.PI) * WIRE_SAG;
        points.push(x0, sag(t0), -2 + dz * 1.4, x1, sag(t1), -2 + dz * 1.4);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  return new LineSegments(geometry, new LineBasicMaterial({ color: PALETTE.woodDark }));
}

function buildTelegraph(): LandmarkBuild {
  const group = new Group();
  const office = cabin(7, 4.2, 5.5);
  office.add(
    ...windows(7, 2.2, 2.8),
    box([4, 0.9, 0.12], PALETTE.canvas, { position: [0, 4.6, 2.85] }),
  );
  group.add(dirtPad(8.5), office, poles(), wires());
  return { group, signHeight: 9, clearance: 9 };
}

/** Telegraph office → Contact (telegram form). */
export const telegraphSpec: LandmarkSpec = {
  id: 'telegraph',
  label: 'Telegraph Office',
  section: 'Contact',
  panel: 'contact',
  angleDeg: 18,
  build: buildTelegraph,
};
