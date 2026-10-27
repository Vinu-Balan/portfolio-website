import { Group, type MeshLambertMaterial } from 'three';
import { PALETTE } from '../config';
import { box, cylinder, flatMaterial, gableRoof } from '../scene/materials';
import type { LandmarkBuild, LandmarkSpec } from './Landmark';
import { dirtPad, post } from './parts';

const SHED_WIDTH = 9;
const SHED_DEPTH = 6;
const SHED_HEIGHT = 4;
const GLOW_COLOR = 0xff6a1f;

function shed(): Group {
  const group = new Group();
  const hx = SHED_WIDTH / 2;
  const hz = SHED_DEPTH / 2;
  group.add(
    ...[
      [-hx, -hz],
      [hx, -hz],
      [-hx, hz],
      [hx, hz],
    ].map(([x = 0, z = 0]) => post(SHED_HEIGHT, x, z, 0.22)),
    box([SHED_WIDTH, SHED_HEIGHT, 0.25], PALETTE.wood, { position: [0, 0, -hz] }),
    gableRoof(SHED_WIDTH + 1, SHED_DEPTH + 1, 2.2, PALETTE.roof, { position: [0, SHED_HEIGHT, 0] }),
  );
  return group;
}

function forge(glow: MeshLambertMaterial): Group {
  const group = new Group();
  const coals = box([1.6, 0.2, 1.6], GLOW_COLOR, { position: [0, 1.2, 0], castShadow: false });
  coals.material = glow;
  group.add(
    box([2.2, 1.2, 2.2], PALETTE.rock),
    coals,
    cylinder(0.35, 0.5, 4, PALETTE.rock, { position: [0, 1.4, -0.6] }),
  );
  group.position.set(-2.6, 0, -1);
  return group;
}

function anvil(): Group {
  const group = new Group();
  group.add(
    cylinder(0.45, 0.55, 0.7, PALETTE.woodDark),
    box([0.5, 0.35, 0.5], PALETTE.metal, { position: [0, 0.7, 0] }),
    box([1.4, 0.35, 0.6], PALETTE.metal, { position: [0.1, 1.05, 0] }),
  );
  group.position.set(0.6, 0, 1.2);
  return group;
}

function workbench(): Group {
  const group = new Group();
  group.add(
    box([3.2, 0.2, 1.2], PALETTE.wood, { position: [0, 1.1, 0] }),
    ...[
      [-1.4, -0.45],
      [1.4, -0.45],
      [-1.4, 0.45],
      [1.4, 0.45],
    ].map(([x = 0, z = 0]) => post(1.1, x, z, 0.08)),
    box([0.12, 0.12, 0.9], PALETTE.wood, { position: [-0.6, 1.25, 0], rotation: [0, 0.4, 0] }),
    box([0.45, 0.25, 0.25], PALETTE.metal, {
      position: [-0.45, 1.27, 0.35],
      rotation: [0, 0.4, 0],
    }),
    cylinder(0.12, 0.18, 0.6, PALETTE.brass, { position: [0.8, 1.2, 0] }),
  );
  group.position.set(2.4, 0, -1.6);
  return group;
}

function buildWorkshop(): LandmarkBuild {
  const group = new Group();
  const glow = flatMaterial(GLOW_COLOR, GLOW_COLOR).clone();
  group.add(
    dirtPad(8.5),
    shed(),
    forge(glow),
    anvil(),
    workbench(),
    cylinder(0.7, 0.6, 1.4, PALETTE.woodDark, { position: [4.8, 0, 2.6] }, 8),
  );
  return {
    group,
    signHeight: 8,
    clearance: 9,
    update: (elapsed) => {
      glow.emissiveIntensity = 0.75 + Math.sin(elapsed * 3.2) * 0.2 + Math.sin(elapsed * 11) * 0.05;
    },
  };
}

/** Blacksmith's workshop → Skills (tools on a workbench). */
export const workshopSpec: LandmarkSpec = {
  id: 'workshop',
  label: 'Blacksmith Workshop',
  section: 'Skills',
  panel: 'skills',
  angleDeg: 234,
  build: buildWorkshop,
};
