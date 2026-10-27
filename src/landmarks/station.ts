import { BoxGeometry, Group, Vector3 } from 'three';
import { PALETTE } from '../config';
import { createInstancedField } from '../scene/instancedField';
import { box, cone, cylinder, flatMaterial } from '../scene/materials';
import type { LandmarkBuild, LandmarkContext, LandmarkSpec } from './Landmark';
import { cabin, dirtPad, post } from './parts';

const TRACK_LENGTH = 44;
const TRACK_Z = 5;
const TIE_SPACING = 1.4;
const CAR_LENGTH = 4.6;
const CAR_GAP = 0.6;
const CAR_COLORS = [0x8a3b2a, 0x5b6b4a, 0x6a4a3a, 0x4a5a6a, 0x7a5a2a, 0x5a3a4a] as const;

function track(): Group {
  const group = new Group();
  const tieCount = Math.floor(TRACK_LENGTH / TIE_SPACING);
  const ties = createInstancedField(
    new BoxGeometry(0.4, 0.15, 2.6),
    flatMaterial(PALETTE.woodDark),
    tieCount,
    (i) => ({
      position: new Vector3(-TRACK_LENGTH / 2 + i * TIE_SPACING, 0.05, TRACK_Z),
      rotationY: 0,
      scale: 1,
    }),
  );
  group.add(
    ties,
    ...[-0.7, 0.7].map((dz) =>
      box([TRACK_LENGTH, 0.15, 0.12], PALETTE.metal, {
        position: [0, 0.12, TRACK_Z + dz],
        castShadow: false,
      }),
    ),
  );
  return group;
}

function locomotive(): Group {
  const group = new Group();
  group.add(
    cylinder(
      0.95,
      0.95,
      4.2,
      PALETTE.metal,
      { rotation: [0, 0, Math.PI / 2], position: [2.1, 1.6, 0] },
      10,
    ),
    box([2, 2.6, 2.2], PALETTE.roof, { position: [-0.9, 0.6, 0] }),
    cone(0.55, 1.2, PALETTE.metal, { rotation: [Math.PI, 0, 0], position: [3.4, 3.8, 0] }, 8),
    box([5.6, 0.5, 1.8], PALETTE.metal, { position: [0.6, 0.3, 0] }),
    cone(0.9, 1, PALETTE.brass, { rotation: [0, 0, Math.PI / 2], position: [4.7, 0.9, 0] }, 4),
  );
  return group;
}

function trainCar(color: number): Group {
  const group = new Group();
  group.add(
    box([CAR_LENGTH, 2.4, 2.2], color, { position: [0, 0.6, 0] }),
    box([CAR_LENGTH + 0.2, 0.18, 2.4], PALETTE.woodDark, { position: [0, 3, 0] }),
  );
  return group;
}

/** Train with one car per project, so the scene mirrors the content. */
function train(projectCount: number): Group {
  const group = new Group();
  group.add(locomotive());
  for (let i = 0; i < projectCount; i++) {
    const car = trainCar(CAR_COLORS[i % CAR_COLORS.length] ?? PALETTE.wood);
    car.position.x = -(i + 1) * (CAR_LENGTH + CAR_GAP) - 0.6;
    group.add(car);
  }
  group.position.set(6, 0.2, TRACK_Z);
  return group;
}

function waterTower(): Group {
  const group = new Group();
  group.add(
    ...[
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].map(([x = 0, z = 0]) => post(5, x, z, 0.14)),
    cylinder(1.8, 1.8, 2.6, PALETTE.wood, { position: [0, 5, 0] }, 10),
    cone(2, 1, PALETTE.roof, { position: [0, 7.6, 0] }, 10),
  );
  group.position.set(9, 0, -3);
  return group;
}

function buildStation(context: LandmarkContext): LandmarkBuild {
  const group = new Group();
  const depot = cabin(7, 4, 5);
  depot.position.set(-3, 0.6, -2);
  group.add(
    dirtPad(12),
    track(),
    box([16, 0.6, 3], PALETTE.wood, { position: [-3, 0, 2.2] }),
    depot,
    waterTower(),
    train(context.content.projects.length),
  );
  return { group, signHeight: 9, clearance: 16 };
}

/** Train station → Projects (each car is a project). */
export const stationSpec: LandmarkSpec = {
  id: 'station',
  label: 'Train Station',
  section: 'Projects',
  panel: 'projects',
  angleDeg: 306,
  build: buildStation,
};
