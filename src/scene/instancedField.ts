import {
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three';

export interface Placement {
  readonly position: Vector3;
  readonly rotationY: number;
  readonly scale: number;
}

/** Return null to reject a candidate (e.g. too close to a building); the field retries. */
export type PlacementFn = (index: number) => Placement | null;

const MAX_ATTEMPTS_PER_INSTANCE = 4;

/**
 * Build an InstancedMesh from a placement function. One draw call for thousands of
 * blades, rocks or cacti. `aPhase` is a per-instance random used by shaders.
 */
export function createInstancedField(
  geometry: BufferGeometry,
  material: Material,
  count: number,
  placementFn: PlacementFn,
): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, count);
  const matrix = new Matrix4();
  const rotation = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const scale = new Vector3();
  const phases = new Float32Array(count);
  let placed = 0;
  for (let attempt = 0; attempt < count * MAX_ATTEMPTS_PER_INSTANCE && placed < count; attempt++) {
    const placement = placementFn(attempt);
    if (!placement) continue;
    rotation.setFromAxisAngle(up, placement.rotationY);
    scale.setScalar(placement.scale);
    matrix.compose(placement.position, rotation, scale);
    mesh.setMatrixAt(placed, matrix);
    phases[placed] = placement.rotationY;
    placed++;
  }
  mesh.count = placed;
  mesh.userData.capacity = placed;
  geometry.setAttribute('aPhase', new InstancedBufferAttribute(phases, 1));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}

/** Show only the first `count` instances; used by the adaptive quality manager. */
export function setVisibleInstances(mesh: InstancedMesh, count: number): void {
  const capacity = typeof mesh.userData.capacity === 'number' ? mesh.userData.capacity : mesh.count;
  mesh.count = Math.min(capacity, count);
}
