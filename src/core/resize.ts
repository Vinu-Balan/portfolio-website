import type { PerspectiveCamera, WebGLRenderer } from 'three';
import { CAMERA } from '../config';

/** Portrait phones need a wider lens so the whole valley still fits. */
const PORTRAIT_FOV = 62;

export type ResizeListener = (width: number, height: number) => void;

/** Keep renderer, camera and any extra targets (post-processing) sized to the stage. */
export function observeResize(
  container: HTMLElement,
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  extra: ResizeListener[] = [],
): () => void {
  const apply = (): void => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.fov = camera.aspect < 1 ? PORTRAIT_FOV : CAMERA.fov;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    extra.forEach((listener) => {
      listener(width, height);
    });
  };
  const observer = new ResizeObserver(apply);
  observer.observe(container);
  apply();
  return () => {
    observer.disconnect();
  };
}
