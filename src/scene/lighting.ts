import {
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  Vector3,
  type PointsMaterial,
  type Scene,
} from 'three';
import { LIGHTING, PALETTE, type QualityTier } from '../config';
import { lerp } from '../utils/math';
import type { Sky } from './sky';

const SUN_DISTANCE = 140;
const SUN_ELEVATION_DAY = 0.85;
const SUN_ELEVATION_DUSK = 0.1;
const SHADOW_EXTENT = 70;
const STAR_FADE_START = 0.55;

export interface Lighting {
  readonly sun: DirectionalLight;
  /** Shared tint applied to custom shaders (grass) so they follow the cycle. */
  readonly tint: Color;
  /** duskFactor: 0 = golden afternoon, 1 = deep dusk. */
  update(duskFactor: number): void;
  applyQuality(tier: QualityTier): void;
}

const colors = {
  dayFog: new Color(PALETTE.dayFog),
  duskFog: new Color(PALETTE.duskFog),
  daySun: new Color(PALETTE.daySun),
  duskSun: new Color(PALETTE.duskSun),
  dayAmbient: new Color(PALETTE.dayAmbient),
  duskAmbient: new Color(PALETTE.duskAmbient),
  dayZenith: new Color(PALETTE.dayZenith),
  duskZenith: new Color(PALETTE.duskZenith),
  dayHorizon: new Color(PALETTE.dayHorizon),
  duskHorizon: new Color(PALETTE.duskHorizon),
};

function createSun(): DirectionalLight {
  const sun = new DirectionalLight(PALETTE.daySun, LIGHTING.sunIntensityDay);
  sun.castShadow = true;
  const cam = sun.shadow.camera;
  cam.left = -SHADOW_EXTENT;
  cam.right = SHADOW_EXTENT;
  cam.top = SHADOW_EXTENT;
  cam.bottom = -SHADOW_EXTENT;
  cam.near = 10;
  cam.far = SUN_DISTANCE * 2.5;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.4;
  return sun;
}

/**
 * Day→dusk cycle by animating a handful of colours and intensities, which is far
 * cheaper than real-time sky scattering and reads just as well with fog.
 */
export function createLighting(scene: Scene, sky: Sky): Lighting {
  const sun = createSun();
  const hemi = new HemisphereLight(PALETTE.dayAmbient, PALETTE.rock, LIGHTING.ambientIntensityDay);
  const fog = new FogExp2(PALETTE.dayFog, LIGHTING.fogDensityDay);
  const sunDirection = new Vector3();
  const tint = new Color(1, 1, 1);
  scene.add(sun, sun.target, hemi);
  scene.fog = fog;
  const starMaterial = sky.stars.material as PointsMaterial;

  const update = (dusk: number): void => {
    const elevation = lerp(SUN_ELEVATION_DAY, SUN_ELEVATION_DUSK, dusk);
    sunDirection.set(0.35, elevation, -1).normalize();
    sun.position.copy(sunDirection).multiplyScalar(SUN_DISTANCE);
    sun.color.lerpColors(colors.daySun, colors.duskSun, dusk);
    sun.intensity = lerp(LIGHTING.sunIntensityDay, LIGHTING.sunIntensityDusk, dusk);
    hemi.color.lerpColors(colors.dayAmbient, colors.duskAmbient, dusk);
    hemi.intensity = lerp(LIGHTING.ambientIntensityDay, LIGHTING.ambientIntensityDusk, dusk);
    fog.color.lerpColors(colors.dayFog, colors.duskFog, dusk);
    fog.density = lerp(LIGHTING.fogDensityDay, LIGHTING.fogDensityDusk, dusk);
    sky.uniforms.uZenith.value.lerpColors(colors.dayZenith, colors.duskZenith, dusk);
    sky.uniforms.uHorizon.value.lerpColors(colors.dayHorizon, colors.duskHorizon, dusk);
    sky.uniforms.uSunColor.value.copy(sun.color);
    sky.uniforms.uSunDirection.value.copy(sunDirection);
    starMaterial.opacity = Math.max(0, (dusk - STAR_FADE_START) / (1 - STAR_FADE_START));
    tint
      .copy(hemi.color)
      .lerp(sun.color, 0.5)
      .multiplyScalar(lerp(1.1, 0.7, dusk));
  };

  const applyQuality = (tier: QualityTier): void => {
    sun.castShadow = tier.shadows;
    if (sun.shadow.mapSize.x !== tier.shadowMapSize) {
      sun.shadow.mapSize.set(tier.shadowMapSize, tier.shadowMapSize);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
  };

  return { sun, tint, update, applyQuality };
}
