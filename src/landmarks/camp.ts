import { DodecahedronGeometry, Group, Mesh, PointLight } from 'three';
import { LIGHTING, PALETTE } from '../config';
import { box, cone, cylinder, flatMaterial } from '../scene/materials';
import type { LandmarkBuild, LandmarkSpec } from './Landmark';
import { dirtPad } from './parts';

const STONE_COUNT = 9;
const STONE_RING = 1.3;
const FLAME_COLORS = [0xff7a1a, 0xffb347, 0xffe08a] as const;
const FLICKER_SPEED = 9;

function stoneRing(): Group {
  const ring = new Group();
  const geometry = new DodecahedronGeometry(0.32, 0);
  for (let i = 0; i < STONE_COUNT; i++) {
    const angle = (i / STONE_COUNT) * Math.PI * 2;
    const stone = new Mesh(geometry, flatMaterial(PALETTE.rock));
    stone.position.set(Math.cos(angle) * STONE_RING, 0.15, Math.sin(angle) * STONE_RING);
    ring.add(stone);
  }
  return ring;
}

function logs(): Group {
  const group = new Group();
  const a = cylinder(0.18, 0.18, 2.2, PALETTE.woodDark, {
    rotation: [0, 0, Math.PI / 2],
    position: [1.1, 0.2, 0],
  });
  const b = cylinder(0.18, 0.18, 2.2, PALETTE.woodDark, {
    rotation: [Math.PI / 2, 0, 0],
    position: [0, 0.35, -1.1],
  });
  group.add(a, b);
  return group;
}

function flames(): Mesh[] {
  return FLAME_COLORS.map((color, i) =>
    cone(
      0.55 - i * 0.14,
      1.5 - i * 0.3,
      color,
      {
        emissive: color,
        castShadow: false,
        position: [Math.sin(i * 2.1) * 0.15, 0.25, Math.cos(i * 2.1) * 0.15],
      },
      7,
    ),
  );
}

function tent(): Group {
  const group = new Group();
  group.add(
    cone(2.4, 3.2, PALETTE.canvas, {}, 4),
    box([0.9, 1.6, 0.05], PALETTE.woodDark, { position: [0, 0, 1.72], rotation: [-0.5, 0, 0] }),
  );
  group.position.set(-4.5, 0, -3.5);
  group.rotation.y = Math.PI / 4;
  return group;
}

function buildCamp(): LandmarkBuild {
  const group = new Group();
  const fire = new Group();
  const flameMeshes = flames();
  const light = new PointLight(
    PALETTE.ember,
    LIGHTING.campfireLightIntensity,
    LIGHTING.campfireLightDistance,
    1.6,
  );
  light.position.y = 1.5;
  fire.add(stoneRing(), logs(), ...flameMeshes, light);
  const seat = cylinder(0.35, 0.35, 3, PALETTE.wood, {
    rotation: [0, 0, Math.PI / 2],
    position: [1.5, 0.35, 3],
  });
  group.add(dirtPad(8), fire, tent(), seat);
  return {
    group,
    signHeight: 6,
    clearance: 13,
    attachments: { fire },
    update: (elapsed) => {
      flameMeshes.forEach((flame, i) => {
        const flicker =
          1 +
          Math.sin(elapsed * FLICKER_SPEED + i * 2.1) * 0.12 +
          Math.sin(elapsed * 23 + i) * 0.05;
        flame.scale.set(1, flicker, 1);
        flame.rotation.y = elapsed * (0.6 + i * 0.4);
      });
      light.intensity =
        LIGHTING.campfireLightIntensity *
        (0.85 + Math.sin(elapsed * 13) * 0.08 + Math.sin(elapsed * 7.3) * 0.07);
    },
  };
}

/** Campfire camp → About. Sits nearest the title camera so the intro starts here. */
export const campSpec: LandmarkSpec = {
  id: 'camp',
  label: 'Campfire Camp',
  section: 'About',
  panel: 'about',
  angleDeg: 90,
  build: buildCamp,
};
