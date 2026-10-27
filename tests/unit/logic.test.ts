import { describe, expect, it, vi } from 'vitest';
import { PERF, QUALITY_TIERS } from '../../src/config';
import { commandForKey } from '../../src/core/input';
import { createQualityManager, initialTierIndex } from '../../src/core/qualityManager';
import { decideMode, isLowEnd, type DeviceSignals } from '../../src/utils/device';
import { pingPong } from '../../src/utils/easing';
import { average, clamp, smoothstep, wrapIndex } from '../../src/utils/math';
import { createRandom, fbm } from '../../src/utils/random';
import { buildMailto, validateTelegram } from '../../src/utils/validation';

const capable: DeviceSignals = {
  reducedMotion: false,
  webgl: true,
  maxTextureSize: 16384,
  deviceMemoryGb: 8,
  cores: 8,
};

describe('math helpers', () => {
  it('clamps, wraps and averages', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(7, 5)).toBe(2);
    expect(average([])).toBe(0);
    expect(average([2, 4])).toBe(3);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5);
  });

  it('pingPong goes 0 → 1 → 0 over one phase', () => {
    expect(pingPong(0)).toBeCloseTo(0);
    expect(pingPong(0.5)).toBeCloseTo(1);
    expect(pingPong(1)).toBeCloseTo(0);
  });
});

describe('seeded randomness', () => {
  it('is deterministic per seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('fbm stays in [0, 1]', () => {
    for (let i = 0; i < 200; i++) {
      const v = fbm(i * 0.37, i * 0.11, 7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('mode decision', () => {
  it('uses the world on capable hardware', () => {
    expect(decideMode({ mode: null, freeze: false }, capable).mode).toBe('world');
  });

  it('serves classic mode for reduced motion, no WebGL and low-end devices', () => {
    const flags = { mode: null, freeze: false } as const;
    expect(decideMode(flags, { ...capable, reducedMotion: true }).reason).toBe('reduced-motion');
    expect(decideMode(flags, { ...capable, webgl: false }).reason).toBe('no-webgl');
    expect(decideMode(flags, { ...capable, deviceMemoryGb: 1 }).reason).toBe('low-end');
  });

  it('honours explicit ?mode=, but never forces 3D without WebGL', () => {
    expect(decideMode({ mode: 'classic', freeze: false }, capable).mode).toBe('classic');
    expect(
      decideMode({ mode: 'world', freeze: false }, { ...capable, reducedMotion: true }).mode,
    ).toBe('world');
    expect(decideMode({ mode: 'world', freeze: false }, { ...capable, webgl: false }).mode).toBe(
      'classic',
    );
  });

  it('flags weak GPUs as low-end', () => {
    expect(isLowEnd({ ...capable, maxTextureSize: 2048 })).toBe(true);
    expect(isLowEnd(capable)).toBe(false);
  });
});

describe('adaptive quality manager', () => {
  const feed = (manager: { sample: (d: number) => void }, fps: number, seconds: number): void => {
    for (let t = 0; t < seconds; t += 1 / fps) manager.sample(1 / fps);
  };

  it('applies the starting tier immediately', () => {
    const apply = vi.fn();
    createQualityManager(2, apply);
    expect(apply).toHaveBeenCalledWith(QUALITY_TIERS[2]);
  });

  it('steps down when FPS sags and does not climb back above the ceiling', () => {
    const apply = vi.fn();
    const manager = createQualityManager(2, apply);
    feed(manager, 30, PERF.sampleWindowSec + 0.1);
    expect(manager.tier().name).toBe('medium');
    feed(manager, 60, PERF.sampleWindowSec * 10);
    expect(manager.tier().name).toBe('medium');
  });

  it('steps up after a sustained fast streak', () => {
    const manager = createQualityManager(0, vi.fn());
    feed(manager, 60, PERF.sampleWindowSec * (PERF.upgradeStreakRequired + 1));
    expect(manager.tier().name).toBe('medium');
  });

  it('picks a cautious starting tier for mobile and weak GPUs', () => {
    expect(initialTierIndex(false, 16384)).toBe(QUALITY_TIERS.length - 1);
    expect(initialTierIndex(true, 16384)).toBe(1);
    expect(initialTierIndex(false, 1024)).toBe(0);
  });
});

describe('keyboard commands', () => {
  it('maps arrows, WASD (any case), Enter and Escape', () => {
    expect(commandForKey('ArrowRight')).toBe('next');
    expect(commandForKey('D')).toBe('next');
    expect(commandForKey('a')).toBe('previous');
    expect(commandForKey('Enter')).toBe('open');
    expect(commandForKey('Escape')).toBe('close');
    expect(commandForKey('q')).toBeNull();
  });
});

describe('telegram validation', () => {
  it('rejects empty fields', () => {
    const errors = validateTelegram({ name: '', email: '', message: '' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name']);
  });

  it('rejects malformed email', () => {
    expect(
      validateTelegram({ name: 'A', email: 'nope@', message: 'Hello there partner' }).email,
    ).toBeDefined();
  });

  it('accepts a valid telegram and builds an encoded mailto', () => {
    const fields = { name: 'Ada', email: 'ada@example.com', message: 'Howdy & welcome!' };
    expect(validateTelegram(fields)).toEqual({});
    const href = buildMailto('me@example.com', fields);
    expect(href.startsWith('mailto:me@example.com?subject=')).toBe(true);
    expect(href).toContain(encodeURIComponent('Howdy & welcome!'));
  });
});
