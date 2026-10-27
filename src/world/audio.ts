import type { Howl } from 'howler';
import { AUDIO } from '../config';
import { createRandom, type Random } from '../utils/random';

/**
 * Ambient soundscape synthesised in code (wind, fire crackle, distant birds) and encoded
 * as a WAV loop. Nothing is downloaded, so there are no third-party audio licences.
 */

const WIND_SMOOTHING = 0.985;
const WIND_GAIN = 2.2;
const CRACKLE_PROBABILITY = 0.0009;
const CRACKLE_DECAY = 0.993;
const BIRD_COUNT = 4;
const BIRD_DURATION_SEC = 0.18;
const BIRD_BASE_HZ = 2400;
const PCM_MAX = 0x7fff;

function windSample(state: { brown: number }, random: Random, t: number): number {
  state.brown = state.brown * WIND_SMOOTHING + (random() * 2 - 1) * (1 - WIND_SMOOTHING);
  const gust = 0.55 + 0.45 * Math.sin(t * 0.7) * Math.sin(t * 0.23 + 1);
  return state.brown * WIND_GAIN * gust;
}

function addBirds(samples: Float32Array, random: Random): void {
  const rate = AUDIO.sampleRate;
  for (let b = 0; b < BIRD_COUNT; b++) {
    const start = Math.floor(random() * (samples.length - rate));
    const length = Math.floor(BIRD_DURATION_SEC * rate);
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const envelope = Math.sin((i / length) * Math.PI);
      const freq = BIRD_BASE_HZ + Math.sin(t * 60) * 600;
      const index = start + i;
      samples[index] = (samples[index] ?? 0) + Math.sin(2 * Math.PI * freq * t) * envelope * 0.05;
    }
  }
}

/** Generate the mono ambience loop as float samples in [-1, 1]. */
export function synthesizeAmbience(seed: number): Float32Array {
  const random = createRandom(seed);
  const samples = new Float32Array(AUDIO.loopSeconds * AUDIO.sampleRate);
  const wind = { brown: 0 };
  let crackle = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / AUDIO.sampleRate;
    if (random() < CRACKLE_PROBABILITY) crackle = 0.4 + random() * 0.4;
    crackle *= CRACKLE_DECAY;
    samples[i] = windSample(wind, random, t) + (random() * 2 - 1) * crackle;
  }
  addBirds(samples, random);
  return samples;
}

/** Encode float samples as a 16-bit PCM mono WAV blob. */
export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => {
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * PCM_MAX, true);
  });
  return new Blob([buffer], { type: 'audio/wav' });
}

export interface Ambience {
  toggle(): Promise<boolean>;
  dispose(): void;
}

/** Muted by default; Howler and the synthesised loop are only created on first unmute. */
export function createAmbience(seed: number): Ambience {
  let howl: Howl | null = null;
  let url = '';
  let playing = false;

  const ensureHowl = async (): Promise<Howl> => {
    if (howl) return howl;
    const { Howl: HowlCtor } = await import('howler');
    url = URL.createObjectURL(encodeWav(synthesizeAmbience(seed), AUDIO.sampleRate));
    howl = new HowlCtor({
      src: [url],
      format: ['wav'],
      loop: true,
      volume: AUDIO.volume,
      html5: false,
    });
    return howl;
  };

  return {
    toggle: async () => {
      const sound = await ensureHowl();
      playing = !playing;
      if (playing) sound.play();
      else sound.pause();
      return playing;
    },
    dispose: () => {
      howl?.unload();
      if (url) URL.revokeObjectURL(url);
    },
  };
}
