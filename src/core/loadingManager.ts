import { LoadingManager } from 'three';

export interface BuildTracker {
  readonly manager: LoadingManager;
  /** Run one build step as a tracked "item" so progress reflects real work done. */
  step<T>(name: string, build: () => T): Promise<T>;
}

/** rAF never fires in a background tab, so the timeout keeps loading moving there. */
const YIELD_TIMEOUT_MS = 50;

/** Yield to the browser so the loader sketch repaints between heavy build steps. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    const done = (): void => {
      resolve();
    };
    requestAnimationFrame(done);
    setTimeout(done, YIELD_TIMEOUT_MS);
  });
}

/**
 * The world is procedural, so instead of downloading files we register each build
 * step with THREE.LoadingManager. That gives the loader honest, monotonic progress.
 */
export function createBuildTracker(
  totalSteps: number,
  onProgress: (progress: number) => void,
): BuildTracker {
  const manager = new LoadingManager();
  manager.onProgress = (_url, loaded) => {
    onProgress(loaded / totalSteps);
  };
  return {
    manager,
    step: async <T>(name: string, build: () => T): Promise<T> => {
      manager.itemStart(name);
      await nextFrame();
      const result = build();
      manager.itemEnd(name);
      return result;
    },
  };
}
