import {
  BackSide,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  Points,
  PointsMaterial,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { ATMOSPHERE, PALETTE } from '../config';
import skyFrag from '../shaders/sky.frag?raw';
import skyVert from '../shaders/sky.vert?raw';
import { createRandom } from '../utils/random';

const SKY_RADIUS = 700;
const STAR_RADIUS = 650;
const STAR_MIN_ALTITUDE = 0.08;

export interface Sky {
  readonly dome: Mesh;
  readonly stars: Points;
  readonly uniforms: {
    uZenith: { value: Color };
    uHorizon: { value: Color };
    uSunColor: { value: Color };
    uSunDirection: { value: Vector3 };
  };
}

function createStars(seed: number): Points {
  const random = createRandom(seed);
  const positions: number[] = [];
  for (let i = 0; i < ATMOSPHERE.starCount; i++) {
    const theta = random() * Math.PI * 2;
    const y = STAR_MIN_ALTITUDE + random() * (1 - STAR_MIN_ALTITUDE);
    const ring = Math.sqrt(1 - y * y);
    positions.push(
      Math.cos(theta) * ring * STAR_RADIUS,
      y * STAR_RADIUS,
      Math.sin(theta) * ring * STAR_RADIUS,
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const material = new PointsMaterial({
    color: 0xfff6e0,
    size: 1.6,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    fog: false,
    depthWrite: false,
  });
  return new Points(geometry, material);
}

/** Gradient sky dome with a soft sun glow, plus a star field that fades in at dusk. */
export function createSky(seed: number): Sky {
  const uniforms = {
    uZenith: { value: new Color(PALETTE.dayZenith) },
    uHorizon: { value: new Color(PALETTE.dayHorizon) },
    uSunColor: { value: new Color(PALETTE.daySun) },
    uSunDirection: { value: new Vector3(0, 0.3, -1).normalize() },
  };
  const material = new ShaderMaterial({
    vertexShader: skyVert,
    fragmentShader: skyFrag,
    uniforms,
    side: BackSide,
    depthWrite: false,
    fog: false,
  });
  const dome = new Mesh(new SphereGeometry(SKY_RADIUS, 32, 16), material);
  dome.name = 'sky';
  dome.renderOrder = -1;
  dome.frustumCulled = false;
  return { dome, stars: createStars(seed), uniforms };
}
