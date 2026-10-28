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
  /** API presence only; a context that still fails to create falls back to classic later. */
  readonly webgl: boolean;
  readonly deviceMemoryGb: number | null;
  readonly cores: number | null;
}

/**
 * Collect the signals used to pick a mode. Deliberately avoids creating a probe WebGL
 * context: that costs hundreds of milliseconds on phones, and the renderer makes its own.
 */
export function readDeviceSignals(): DeviceSignals {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    webgl: typeof WebGLRenderingContext !== 'undefined',
    deviceMemoryGb: nav.deviceMemory ?? null,
    cores: navigator.hardwareConcurrency || null,
  };
}

/** True for devices we expect to struggle with the 3D world. */
export function isLowEnd(signals: DeviceSignals): boolean {
  const lowMemory = signals.deviceMemoryGb !== null && signals.deviceMemoryGb <= PERF.lowMemoryGb;
  const lowCores = signals.cores !== null && signals.cores <= PERF.lowCoreCount;
  return lowMemory || lowCores;
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

/** GPU names that indicate CPU rendering, which cannot sustain the full-quality scene. */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;

/** True when a WebGL renderer string describes a software rasteriser. */
export function isSoftwareRenderer(rendererName: string): boolean {
  return SOFTWARE_RENDERER.test(rendererName);
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
