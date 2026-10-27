import {
  BufferGeometry,
  Float32BufferAttribute,
  HalfFloatType,
  Mesh,
  OrthographicCamera,
  ShaderMaterial,
  WebGLRenderTarget,
  type Camera,
  type Scene,
  type WebGLRenderer,
} from 'three';
import { ATMOSPHERE } from '../config';
import fullscreenVert from '../shaders/fullscreen.vert?raw';
import postfxFrag from '../shaders/postfx.frag?raw';

const MSAA_SAMPLES = 4;

export interface PostFx {
  enabled: boolean;
  render(scene: Scene, camera: Camera, elapsed: number): void;
  setSize(width: number, height: number, pixelRatio: number): void;
  dispose(): void;
}

/** Single oversized triangle covers the screen with no diagonal seam. */
function fullscreenTriangle(): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  return geometry;
}

/**
 * One-pass grade: sepia tint, vignette and film grain. A hand-rolled pass instead of
 * EffectComposer keeps the bundle small and the cost to a single extra draw.
 */
export function createPostFx(renderer: WebGLRenderer): PostFx {
  const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: MSAA_SAMPLES });
  const uniforms = {
    tDiffuse: { value: target.texture },
    uTime: { value: 0 },
    uGrain: { value: ATMOSPHERE.grainAmount },
    uVignette: { value: ATMOSPHERE.vignetteStrength },
    uSepia: { value: ATMOSPHERE.sepiaAmount },
  };
  const material = new ShaderMaterial({
    vertexShader: fullscreenVert,
    fragmentShader: postfxFrag,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new Mesh(fullscreenTriangle(), material);
  quad.frustumCulled = false;
  const orthoCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const postFx: PostFx = {
    enabled: true,
    render: (scene, camera, elapsed) => {
      if (!postFx.enabled) {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
        return;
      }
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      uniforms.uTime.value = elapsed;
      renderer.render(quad, orthoCamera);
    },
    setSize: (width, height, pixelRatio) => {
      target.setSize(Math.floor(width * pixelRatio), Math.floor(height * pixelRatio));
    },
    dispose: () => {
      target.dispose();
      material.dispose();
      quad.geometry.dispose();
    },
  };
  return postFx;
}
