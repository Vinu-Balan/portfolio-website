import type { Portfolio } from '../content/portfolio';
import { createController } from './controller';
import { createCore } from './core';

export interface WorldOptions {
  readonly data: Portfolio;
  readonly frozen: boolean;
  readonly maxTextureSize: number;
  readonly onProgress: (progress: number) => void;
  /** Show classic journal mode; call `onReturn` to come back to the world. */
  readonly onJournal: (onReturn: () => void) => void;
}

export interface World {
  readonly showTitle: () => void;
  readonly openJournal: () => void;
  readonly dispose: () => void;
}

/**
 * Lazily-loaded entry point for the 3D world. Three.js, GSAP and every scene module sit
 * behind this dynamic import, so the loader and classic mode stay tiny.
 */
export async function bootWorld(options: WorldOptions): Promise<World> {
  const core = await createCore(options);
  const controller = createController(core, options);
  core.loop.start();
  return {
    showTitle: controller.showTitle,
    openJournal: controller.openJournal,
    dispose: () => {
      controller.dispose();
      core.dispose();
    },
  };
}
