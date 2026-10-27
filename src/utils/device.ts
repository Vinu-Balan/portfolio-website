import { PERF } from '../config';
import { average } from './math';
import type { QueryFlags } from './query';

export type Mode = 'classic' | 'world';

export type ClassicReason = 'requested' | 'reduced-motion' | 'no-webgl' | 'low-end' | 'slow-fps';

export interface ModeDecision {
  readonly mode: Mode;
  readonly reason: ClassicReason | null;
}

export interface DeviceSignals {
  readonly reducedMotion: boolean;
  readonly webgl: boolean;
  readonly maxTextureSize: number;
  readonly deviceMemoryGb: number | null;
  readonly cores: number | null;
}

/** Probe WebGL once on a throwaway canvas; we never keep this context around. */
export function probeWebGL(): { supported: boolean; maxTextureSize: number } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return { supported: false, maxTextureSize: 0 };
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    return { supported: true, maxTextureSize };
  } catch {
    return { supported: false, maxTextureSize: 0 };
  }
}

/** Collect the signals used to pick a mode. Isolated so tests can feed fakes. */
export function readDeviceSignals(): DeviceSignals {
  const gl = probeWebGL();
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    webgl: gl.supported,
    maxTextureSize: gl.maxTextureSize,
    deviceMemoryGb: nav.deviceMemory ?? null,
    cores: navigator.hardwareConcurrency || null,
  };
}

/** True for devices we expect to struggle with the 3D world. */
export function isLowEnd(signals: DeviceSignals): boolean {
  const lowMemory = signals.deviceMemoryGb !== null && signals.deviceMemoryGb <= PERF.lowMemoryGb;
  const lowCores = signals.cores !== null && signals.cores <= PERF.lowCoreCount;
  const weakGpu = signals.maxTextureSize < PERF.minTextureSize;
  return lowMemory || lowCores || weakGpu;
}

/** Decide between the 3D world and classic mode. An explicit ?mode= always wins. */
export function decideMode(flags: QueryFlags, signals: DeviceSignals): ModeDecision {
  if (flags.mode === 'classic') return { mode: 'classic', reason: 'requested' };
  if (!signals.webgl) return { mode: 'classic', reason: 'no-webgl' };
  if (flags.mode === 'world') return { mode: 'world', reason: null };
  if (signals.reducedMotion) return { mode: 'classic', reason: 'reduced-motion' };
  if (isLowEnd(signals)) return { mode: 'classic', reason: 'low-end' };
  return { mode: 'world', reason: null };
}

/** Sample real frame times for `durationMs` and resolve the average FPS. */
export function measureFps(durationMs: number = PERF.probeDurationMs): Promise<number> {
  return new Promise((resolve) => {
    const deltas: number[] = [];
    let last = performance.now();
    const start = last;
    const tick = (now: number): void => {
      deltas.push(now - last);
      last = now;
      if (now - start < durationMs) requestAnimationFrame(tick);
      else resolve(1000 / Math.max(1, average(deltas)));
    };
    requestAnimationFrame(tick);
  });
}
