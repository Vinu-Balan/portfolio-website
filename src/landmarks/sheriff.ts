import { Group } from 'three';
import { PALETTE } from '../config';
import { box, cylinder } from '../scene/materials';
import type { LandmarkBuild, LandmarkSpec } from './Landmark';
import { dirtPad, post, windows } from './parts';

const WIDTH = 9;
const HEIGHT = 5;
const DEPTH = 7;
const FACADE_HEIGHT = 7.5;
const PORCH_DEPTH = 2.4;

function facade(): Group {
  const group = new Group();
  const front = DEPTH / 2;
  group.add(
    box([WIDTH + 0.4, FACADE_HEIGHT, 0.4], PALETTE.wood, { position: [0, 0, front] }),
    box([WIDTH - 1, 1.1, 0.12], PALETTE.canvas, {
      position: [0, FACADE_HEIGHT - 2.1, front + 0.25],
    }),
    cylinder(
      0.75,
      0.75,
      0.15,
      PALETTE.brass,
      { rotation: [Math.PI / 2, 0, 0], position: [0, FACADE_HEIGHT - 0.9, front + 0.3] },
      5,
    ),
    box([1.3, 2.4, 0.15], PALETTE.woodDark, { position: [0, 0, front + 0.22] }),
    ...windows(WIDTH, 2.2, front + 0.22),
    box([0.8, 1.1, 0.06], PALETTE.canvas, { position: [WIDTH * 0.3, 0.9, front + 0.26] }),
  );
  return group;
}

function porch(): Group {
  const group = new Group();
  const z = DEPTH / 2 + PORCH_DEPTH;
  group.add(
    box([WIDTH + 0.4, 0.25, PORCH_DEPTH], PALETTE.woodDark, {
      position: [0, 0, DEPTH / 2 + PORCH_DEPTH / 2],
    }),
    box([WIDTH + 0.8, 0.2, PORCH_DEPTH + 0.4], PALETTE.roof, {
      position: [0, 3.6, DEPTH / 2 + PORCH_DEPTH / 2],
      rotation: [0.12, 0, 0],
    }),
    ...[-WIDTH / 2, -WIDTH / 6, WIDTH / 6, WIDTH / 2].map((x) => post(3.6, x, z)),
  );
  return group;
}

function hitchingRail(): Group {
  const group = new Group();
  const z = DEPTH / 2 + PORCH_DEPTH + 2;
  group.add(
    post(1.2, -2.5, z),
    post(1.2, 2.5, z),
    box([5.4, 0.15, 0.15], PALETTE.woodDark, { position: [0, 1.1, z] }),
  );
  return group;
}

function buildSheriff(): LandmarkBuild {
  const group = new Group();
  group.add(
    dirtPad(9),
    box([WIDTH, HEIGHT, DEPTH], PALETTE.wood),
    box([WIDTH + 0.6, 0.3, DEPTH + 0.6], PALETTE.roof, { position: [0, HEIGHT, 0] }),
    facade(),
    porch(),
    hitchingRail(),
  );
  return { group, signHeight: FACADE_HEIGHT + 2.5, clearance: 10 };
}

/** Sheriff's office → Experience (the ledger of past jobs). */
export const sheriffSpec: LandmarkSpec = {
  id: 'sheriff',
  label: "Sheriff's Office",
  section: 'Experience',
  panel: 'experience',
  angleDeg: 162,
  build: buildSheriff,
};
