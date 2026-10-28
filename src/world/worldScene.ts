import { PerspectiveCamera, Scene, Vector3, type WebGLRenderer } from 'three';
import { CAMERA, LIGHTING, WORLD, type QualityTier } from '../config';
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
import { createRider, type Rider } from '../scene/rider';
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
  readonly rider: Rider;
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
  readonly landmarks: readonly Landmark[];
  readonly tumbleweed: Tumbleweed;
  readonly rider: Rider;
}

function updateParts(parts: Parts, elapsed: number, frozen: boolean): void {
  const { landmarks, tumbleweed, rider } = parts;
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
  rider.update(time);
  if (!frozen) tumbleweed.update(elapsed);
}

/** Assemble the frontier valley. Each heavy step is tracked so the loader shows real progress. */
export interface BuildOptions {
  readonly renderer: WebGLRenderer;
  readonly data: Portfolio;
  readonly tracker: BuildTracker;
  readonly frozen: boolean;
  /** Instance budgets (grass, embers) are allocated for this tier only, to keep boot cheap. */
  readonly capacity: QualityTier;
}

export async function buildWorldScene(options: BuildOptions): Promise<WorldScene> {
  const { renderer, data, tracker, frozen, capacity } = options;
  const random = createRandom(WORLD.seed);
  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
  const heightAt = createHeightFn();

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
    createGrass(heightAt, random, capacity.grassCount, isClear),
  );
  const embers = createEmbers(capacity.emberCount, random);
  landmarks.find((l) => l.id === 'camp')?.attachments.fire?.add(embers.points);
  const tumbleweed = createTumbleweed(heightAt, random);
  scene.add(grass.mesh, tumbleweed.group);
  // Parallel compile keeps the main thread free, but three.js warns when the extension is
  // missing (software GL), so only use it where it exists.
  const compile = renderer.extensions.has('KHR_parallel_shader_compile')
    ? () => renderer.compileAsync(scene, camera)
    : () => {
        renderer.compile(scene, camera);
      };
  await tracker.step('shaders', compile);

  const camp = landmarks.find((l) => l.id === 'camp');
  const campBase = camp?.group.position ?? new Vector3();
  const rider = createRider(heightAt, camp?.riderSpot ?? new Vector3(), campBase);
  scene.add(rider.group);
  const parts: Parts = { lighting, grass, embers, landmarks, tumbleweed, rider };
  const titleView = {
    position: campBase.clone().add(new Vector3(...CAMERA.titleOffset)),
    target: campBase.clone().add(new Vector3(...CAMERA.titleTargetOffset)),
  };
  updateParts(parts, 0, frozen);
  return {
    scene,
    camera,
    landmarks,
    tumbleweed,
    rider,
    titleView,
    update: (elapsed) => {
      updateParts(parts, elapsed, frozen);
    },
    applyQuality: (tier, pixelRatio) => {
      lighting.applyQuality(tier);
      setVisibleInstances(grass.mesh, tier.grassCount);
      embers.setCount(tier.emberCount);
      embers.setPixelRatio(pixelRatio);
    },
  };
}
