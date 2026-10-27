import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Mesh,
  MeshLambertMaterial,
  type BufferGeometry,
  type ColorRepresentation,
} from 'three';

const cache = new Map<string, MeshLambertMaterial>();

/** Shared flat-shaded material per colour: fewer programs and state switches, low-poly look. */
export function flatMaterial(color: number, emissive = 0): MeshLambertMaterial {
  const key = `${color}:${emissive}`;
  let material = cache.get(key);
  if (!material) {
    material = new MeshLambertMaterial({ color, emissive, flatShading: true });
    cache.set(key, material);
  }
  return material;
}

/** Drop the cache so materials are rebuilt after a full world teardown. */
export function clearMaterialCache(): void {
  cache.forEach((material) => {
    material.dispose();
  });
  cache.clear();
}

interface MeshOptions {
  readonly position?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly castShadow?: boolean;
  readonly emissive?: ColorRepresentation;
}

function placed(geometry: BufferGeometry, color: number, options: MeshOptions): Mesh {
  const emissive = typeof options.emissive === 'number' ? options.emissive : 0;
  const mesh = new Mesh(geometry, flatMaterial(color, emissive));
  if (options.position) mesh.position.set(...options.position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Box with its base sitting on y = position.y, which matches how buildings are placed. */
export function box(
  size: readonly [number, number, number],
  color: number,
  options: MeshOptions = {},
): Mesh {
  const geometry = new BoxGeometry(...size);
  geometry.translate(0, size[1] / 2, 0);
  return placed(geometry, color, options);
}

export function cylinder(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  color: number,
  options: MeshOptions = {},
  segments = 7,
): Mesh {
  const geometry = new CylinderGeometry(radiusTop, radiusBottom, height, segments);
  geometry.translate(0, height / 2, 0);
  return placed(geometry, color, options);
}

export function cone(
  radius: number,
  height: number,
  color: number,
  options: MeshOptions = {},
  segments = 6,
): Mesh {
  const geometry = new ConeGeometry(radius, height, segments);
  geometry.translate(0, height / 2, 0);
  return placed(geometry, color, options);
}

/** Triangular-prism roof spanning `width` along x and `depth` along z. */
export function gableRoof(
  width: number,
  depth: number,
  height: number,
  color: number,
  options: MeshOptions = {},
): Mesh {
  // A 3-sided cylinder is a prism; its triangle has circumradius r, base at -r/2, apex at r.
  const radius = height / 1.5;
  const geometry = new CylinderGeometry(radius, radius, depth, 3, 1);
  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);
  geometry.scale(width / (radius * Math.sqrt(3)), 1, 1);
  geometry.translate(0, radius / 2, 0);
  return placed(geometry, color, options);
}
