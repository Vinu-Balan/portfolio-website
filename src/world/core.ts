import { Vector3, type WebGLRenderer } from 'three';
import { CAMERA, QUALITY_TIERS, tierAt, type QualityTier } from '../config';
import type { Portfolio } from '../content/portfolio';
import { createBuildTracker } from '../core/loadingManager';
import { createLoop, type Loop } from '../core/loop';
import { createQualityManager, initialTierIndex } from '../core/qualityManager';
import { createRenderer } from '../core/renderer';
import { observeResize } from '../core/resize';
import { createPostFx, type PostFx } from '../scene/postfx';
import { clearMaterialCache } from '../scene/materials';
import { requireElement } from '../ui/component';
import { isSoftwareRenderer } from '../utils/device';
import { disposeObject3D } from '../utils/dispose';
import type { CameraRig } from '../utils/flyCameraTo';
import { buildWorldScene, WORLD_BUILD_STEPS, type WorldScene } from './worldScene';

const MOBILE_QUERY = '(max-width: 760px), (pointer: coarse)';

export interface CoreOptions {
  readonly data: Portfolio;
  readonly frozen: boolean;
  readonly onProgress: (progress: number) => void;
  /** Pins a quality tier by name; otherwise it is chosen from the device. */
  readonly quality: QualityTier['name'] | null;
}

/** Everything that renders: no UI, no navigation logic. */
export interface Core {
  readonly renderer: WebGLRenderer;
  readonly world: WorldScene;
  readonly rig: CameraRig;
  readonly loop: Loop;
  readonly stage: HTMLElement;
  /** Extra per-frame work (hotspot projection) registered by the controller. */
  onFrame(callback: () => void): void;
  dispose(): void;
}

export const vec3 = (v: readonly [number, number, number]): Vector3 => new Vector3(...v);

function createFrame(
  world: WorldScene,
  rig: CameraRig,
  postFx: PostFx,
  frozen: boolean,
): (elapsed: number) => void {
  const breath = new Vector3();
  return (elapsed) => {
    world.update(elapsed);
    const t = frozen ? 0 : elapsed * CAMERA.breathSpeed;
    breath.set(Math.sin(t) * CAMERA.breathAmplitude, Math.sin(t * 1.3) * CAMERA.breathAmplitude, 0);
    world.camera.position.copy(rig.position).add(breath);
    world.camera.lookAt(rig.target);
    postFx.render(world.scene, world.camera, frozen ? 0 : elapsed);
  };
}

function wireQuality(
  renderer: WebGLRenderer,
  world: WorldScene,
  postFx: PostFx,
  stage: HTMLElement,
  startIndex: number,
) {
  return createQualityManager(startIndex, (tier) => {
    const ratio = Math.min(window.devicePixelRatio, tier.maxPixelRatio);
    renderer.setPixelRatio(ratio);
    postFx.enabled = tier.postFx;
    world.applyQuality(tier, ratio);
    postFx.setSize(stage.clientWidth, stage.clientHeight, ratio);
  });
}

/** Renderer name from the debug extension, or '' when the browser hides it. */
function rendererName(renderer: WebGLRenderer): string {
  const gl = renderer.getContext();
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
}

/** An explicit ?quality= wins; otherwise software GL and weak devices start on a cheap tier. */
function chooseStartTier(renderer: WebGLRenderer, forced: QualityTier['name'] | null): number {
  const forcedIndex = QUALITY_TIERS.findIndex((tier) => tier.name === forced);
  if (forcedIndex >= 0) return forcedIndex;
  return initialTierIndex(
    window.matchMedia(MOBILE_QUERY).matches,
    renderer.capabilities.maxTextureSize,
    isSoftwareRenderer(rendererName(renderer)),
  );
}

/** Create renderer, scene, post-processing, adaptive quality and the frame loop. */
export async function createCore(options: CoreOptions): Promise<Core> {
  const stage = requireElement('#stage');
  const renderer = createRenderer(stage);
  const tracker = createBuildTracker(WORLD_BUILD_STEPS, options.onProgress);
  const startIndex = chooseStartTier(renderer, options.quality);
  const capacity = tierAt(startIndex);
  const world = await buildWorldScene({
    renderer,
    data: options.data,
    tracker,
    frozen: options.frozen,
    capacity,
  });
  const rig: CameraRig = {
    position: world.titleView.position.clone(),
    target: world.titleView.target.clone(),
  };
  const postFx = createPostFx(renderer);
  const quality = wireQuality(renderer, world, postFx, stage, startIndex);
  const stopResize = observeResize(stage, renderer, world.camera, [
    (w, h) => {
      postFx.setSize(w, h, renderer.getPixelRatio());
    },
  ]);
  const frame = createFrame(world, rig, postFx, options.frozen);
  const extras: (() => void)[] = [];
  const loop = createLoop((delta, elapsed) => {
    if (!options.frozen) quality.sample(delta);
    frame(elapsed);
    extras.forEach((extra) => {
      extra();
    });
  }, options.frozen);
  return {
    renderer,
    world,
    rig,
    loop,
    stage,
    onFrame: (callback) => {
      extras.push(callback);
    },
    dispose: () => {
      loop.dispose();
      stopResize();
      postFx.dispose();
      disposeObject3D(world.scene);
      clearMaterialCache();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
