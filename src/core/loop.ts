/** Frame callback: delta and elapsed are in seconds. */
export type FrameHandler = (delta: number, elapsed: number) => void;

export type PauseReason = 'hidden' | 'panel' | 'classic';

export interface Loop {
  start(): void;
  pause(reason: PauseReason): void;
  resume(reason: PauseReason): void;
  isRunning(): boolean;
  /** Render exactly one frame, e.g. after a resize while paused. */
  renderOnce(): void;
  dispose(): void;
}

/** Long gaps (tab switches, debugger) would make animations jump; cap a single step. */
const MAX_DELTA_SEC = 0.1;
const FROZEN_DELTA_SEC = 1 / 60;

/**
 * requestAnimationFrame loop that stops entirely while any pause reason is active,
 * so a covered or hidden scene costs no GPU time.
 */
export function createLoop(onFrame: FrameHandler, frozen = false): Loop {
  const reasons = new Set<PauseReason>();
  let frameId = 0;
  let last = 0;
  let elapsed = 0;
  let started = false;

  const step = (now: number): void => {
    const delta = frozen ? FROZEN_DELTA_SEC : Math.min(MAX_DELTA_SEC, (now - last) / 1000);
    last = now;
    elapsed += delta;
    onFrame(delta, elapsed);
    frameId = requestAnimationFrame(step);
  };

  const run = (): void => {
    if (!started || reasons.size > 0 || frameId !== 0) return;
    last = performance.now();
    frameId = requestAnimationFrame(step);
  };

  const halt = (): void => {
    cancelAnimationFrame(frameId);
    frameId = 0;
  };

  const onVisibility = (): void => {
    if (document.hidden) loop.pause('hidden');
    else loop.resume('hidden');
  };

  const loop: Loop = {
    start: () => {
      started = true;
      run();
    },
    pause: (reason) => {
      reasons.add(reason);
      halt();
    },
    resume: (reason) => {
      reasons.delete(reason);
      run();
    },
    isRunning: () => frameId !== 0,
    renderOnce: () => {
      onFrame(0, elapsed);
    },
    dispose: () => {
      halt();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
  document.addEventListener('visibilitychange', onVisibility);
  return loop;
}
