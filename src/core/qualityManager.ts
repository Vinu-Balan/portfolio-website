import { PERF, QUALITY_TIERS, type QualityTier } from '../config';
import { clamp } from '../utils/math';

export type ApplyTier = (tier: QualityTier) => void;

export interface QualityManager {
  readonly tier: () => QualityTier;
  /** Feed one frame delta (seconds). Re-evaluates the tier once per sample window. */
  sample(deltaSec: number): void;
}

/** Pick a starting tier from cheap static hints before any frames are measured. */
export function initialTierIndex(isMobile: boolean, maxTextureSize: number): number {
  if (maxTextureSize < PERF.minTextureSize) return 0;
  return isMobile ? 1 : QUALITY_TIERS.length - 1;
}

/**
 * Adaptive quality: steps down immediately when FPS sags, steps up only after a
 * sustained streak, and never climbs back above a tier it was forced out of. That
 * stops the oscillation that would otherwise cause visible popping.
 */
export function createQualityManager(startIndex: number, apply: ApplyTier): QualityManager {
  let index = clamp(startIndex, 0, QUALITY_TIERS.length - 1);
  let ceiling = QUALITY_TIERS.length - 1;
  let windowTime = 0;
  let windowFrames = 0;
  let upgradeStreak = 0;

  const current = (): QualityTier => QUALITY_TIERS[index] ?? (QUALITY_TIERS[0] as QualityTier);

  const setIndex = (next: number): void => {
    if (next === index) return;
    index = next;
    apply(current());
  };

  const evaluate = (fps: number): void => {
    if (fps < PERF.downgradeBelowFps && index > 0) {
      ceiling = index - 1;
      upgradeStreak = 0;
      setIndex(index - 1);
      return;
    }
    upgradeStreak = fps > PERF.upgradeAboveFps ? upgradeStreak + 1 : 0;
    if (upgradeStreak >= PERF.upgradeStreakRequired && index < ceiling) {
      upgradeStreak = 0;
      setIndex(index + 1);
    }
  };

  apply(current());
  return {
    tier: current,
    sample: (deltaSec) => {
      if (deltaSec <= 0) return;
      windowTime += deltaSec;
      windowFrames += 1;
      if (windowTime < PERF.sampleWindowSec) return;
      evaluate(windowFrames / windowTime);
      windowTime = 0;
      windowFrames = 0;
    },
  };
}
