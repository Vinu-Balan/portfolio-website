import { describe, expect, it } from 'vitest';
import { loopLength, synthesizeAmbience } from '../../src/world/audio';

/** Fraction of adjacent samples that change sign. White noise sits near 0.5. */
function zeroCrossingRate(samples: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if (Math.sign(samples[i] ?? 0) !== Math.sign(samples[i - 1] ?? 0)) crossings++;
  }
  return crossings / samples.length;
}

describe('background music', () => {
  const samples = synthesizeAmbience(1873);

  it('renders a full, finite loop within headroom', () => {
    expect(samples.length).toBe(loopLength());
    expect(samples.every((s) => Number.isFinite(s))).toBe(true);
    expect(samples.reduce((max, s) => Math.max(max, Math.abs(s)), 0)).toBeLessThanOrEqual(0.61);
  });

  it('is tonal rather than static noise', () => {
    expect(zeroCrossingRate(samples)).toBeLessThan(0.08);
  });

  it('is deterministic for a seed', () => {
    expect(synthesizeAmbience(1873).slice(0, 2000)).toEqual(samples.slice(0, 2000));
  });
});
