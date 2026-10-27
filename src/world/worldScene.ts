import { PerspectiveCamera, Scene, Vector3, type WebGLRenderer } from 'three';
import { CAMERA, LIGHTING, QUALITY_TIERS, WORLD, type QualityTier } from '../config';
import type { Portfolio } from '../content/portfolio';
import type { BuildTracker } from '../core/loadingManager';
import type { Landmark } from '../landmarks/Landmark';
import { createLandmarks, isClearOfLandmarks } from '../landmarks/registry';
import { createEnvironment } from '../scene/environment';
import { createGrass, type Grass } from '../scene/grass';
import { setVisibleInstances } from '../scene/instancedField';
import { createLighting, type Lighting } from '../scene/lighting';
import { createEmbers, type Embers } from '../scene/particles';
import { createSky } from '../scene/sky';
import { createHeightFn, createTerrain } from '../scene/terrain';
import { createTumbleweed, type Tumbleweed } from '../scene/tumbleweed';
import { pingPong } from '../utils/easing';
import { createRandom } from '../utils/random';

/** Starting phase of the lighting cycle: golden hour sliding towards dusk. */
const CYCLE_START_PHASE = 0.22;
/** Frozen runs use a fixed, flattering dusk for stable screenshots. */
const FROZEN_DUSK = 0.4;
const FROZEN_ELAPSED = 4.2;

export interface WorldScene {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly landmarks: readonly Landmark[];
  readonly tumbleweed: Tumbleweed;
  /** Camera framing for the title screen: behind the campfire, looking over the valley. */
  readonly titleView: { readonly position: Vector3; readonly target: Vector3 };
  update(elapsed: number): void;
  applyQuality(tier: QualityTier, pixelRatio: number): void;
}

/** Build steps registered with the loading manager, in order. */
export const WORLD_BUILD_STEPS = 6;

interface Parts {
  readonly lighting: Lighting;
  readonly grass: Grass;
  readonly embers: Embers;
}

function updateParts(
  parts: Parts,
  landmarks: readonly Landmark[],
  tumbleweed: Tumbleweed,
  elapsed: number,
  frozen: boolean,
): void {
  const time = frozen ? FROZEN_ELAPSED : elapsed;
  const dusk = frozen
    ? FROZEN_DUSK
    : pingPong(CYCLE_START_PHASE + elapsed / LIGHTING.cyclePeriodSec);
  parts.lighting.update(dusk);
  parts.grass.update(time, parts.lighting.tint);
  parts.embers.update(time);
  landmarks.forEach((landmark) => {
    landmark.update(time);
  });
  if (!frozen) tumbleweed.update(elapsed);
}

/** Assemble the frontier valley. Each heavy step is tracked so the loader shows real progress. */
export async function buildWorldScene(
  renderer: WebGLRenderer,
  data: Portfolio,
  tracker: BuildTracker,
  frozen: boolean,
): Promise<WorldScene> {
  const random = createRandom(WORLD.seed);
  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
  const heightAt = createHeightFn();
  const maxTier = QUALITY_TIERS[QUALITY_TIERS.length - 1] as QualityTier;

  const sky = await tracker.step('sky', () => createSky(WORLD.seed));
  const lighting = createLighting(scene, sky);
  scene.add(sky.dome, sky.stars);
  scene.add(await tracker.step('terrain', () => createTerrain(heightAt)));
  const landmarks = await tracker.step('landmarks', () =>
    createLandmarks({ heightAt, random, content: data }),
  );
  landmarks.forEach((l) => scene.add(l.group));
  const isClear = (x: number, z: number): boolean => isClearOfLandmarks(landmarks, x, z);
  scene.add(await tracker.step('environment', () => createEnvironment(heightAt, random, isClear)));
  const grass = await tracker.step('grass', () =>
    createGrass(heightAt, random, maxTier.grassCount, isClear),
  );
  const embers = createEmbers(maxTier.emberCount, random);
  landmarks.find((l) => l.id === 'camp')?.attachments.fire?.add(embers.points);
  const tumbleweed = createTumbleweed(heightAt, random);
  scene.add(grass.mesh, tumbleweed.group);
  await tracker.step('shaders', () => renderer.compile(scene, camera));

  const parts: Parts = { lighting, grass, embers };
  const campBase = landmarks.find((l) => l.id === 'camp')?.group.position ?? new Vector3();
  const titleView = {
    position: campBase.clone().add(new Vector3(...CAMERA.titleOffset)),
    target: campBase.clone().add(new Vector3(...CAMERA.titleTargetOffset)),
  };
  updateParts(parts, landmarks, tumbleweed, 0, frozen);
  return {
    scene,
    camera,
    landmarks,
    tumbleweed,
    titleView,
    update: (elapsed) => {
      updateParts(parts, landmarks, tumbleweed, elapsed, frozen);
    },
    applyQuality: (tier, pixelRatio) => {
      lighting.applyQuality(tier);
      setVisibleInstances(grass.mesh, tier.grassCount);
      embers.setCount(tier.emberCount);
      embers.setPixelRatio(pixelRatio);
    },
  };
}
