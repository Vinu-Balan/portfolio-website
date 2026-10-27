import { Vector3 } from 'three';
import { CAMERA, WORLD } from '../config';
import { campSpec } from './camp';
import type { Landmark, LandmarkContext, LandmarkSpec } from './Landmark';
import { sheriffSpec } from './sheriff';
import { stationSpec } from './station';
import { telegraphSpec } from './telegraph';
import { workshopSpec } from './workshop';

/** Keyboard cycling order: clockwise around the valley starting at camp. */
export const LANDMARK_SPECS: readonly LandmarkSpec[] = [
  campSpec,
  sheriffSpec,
  workshopSpec,
  stationSpec,
  telegraphSpec,
];

const TARGET_LIFT = 2.5;

/** World-space x/z on the landmark ring for a given angle. */
export function ringPosition(
  angleDeg: number,
  radius: number = WORLD.landmarkRingRadius,
): { x: number; z: number } {
  const radians = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(radians) * radius, z: Math.sin(radians) * radius };
}

/** Camera sits between the landmark and the valley centre, looking back at it. */
function viewFor(base: Vector3): Landmark['view'] {
  const toCenter = new Vector3(-base.x, 0, -base.z).normalize();
  const position = base.clone().addScaledVector(toCenter, CAMERA.landmarkDistance);
  position.y = base.y + CAMERA.landmarkHeight;
  const target = base.clone().setY(base.y + TARGET_LIFT);
  return { position, target };
}

function placeLandmark(spec: LandmarkSpec, context: LandmarkContext): Landmark {
  const built = spec.build(context);
  const { x, z } = ringPosition(spec.angleDeg);
  const base = new Vector3(x, context.heightAt(x, z), z);
  built.group.position.copy(base);
  built.group.rotation.y = Math.atan2(-x, -z);
  built.group.userData.pickId = spec.id;
  built.group.name = spec.id;
  return {
    id: spec.id,
    label: spec.label,
    section: spec.section,
    panel: spec.panel,
    group: built.group,
    anchor: base.clone().setY(base.y + built.signHeight),
    clearance: built.clearance,
    view: viewFor(base),
    attachments: built.attachments ?? {},
    update: built.update ?? (() => undefined),
  };
}

/** Build and place every landmark on the ring. */
export function createLandmarks(context: LandmarkContext): Landmark[] {
  return LANDMARK_SPECS.map((spec) => placeLandmark(spec, context));
}

/** True when (x, z) is outside every landmark footprint. */
export function isClearOfLandmarks(landmarks: readonly Landmark[], x: number, z: number): boolean {
  return landmarks.every(
    (l) => Math.hypot(l.group.position.x - x, l.group.position.z - z) > l.clearance,
  );
}
