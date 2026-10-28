import type { Howl } from 'howler';
import { AUDIO } from '../config';
import { createRandom, type Random } from '../utils/random';

/**
 * Background music synthesised in code: a slow fingerpicked guitar over a minor
 * "frontier" progression with a soft whistled phrase on top. Rendered once into a
 * seamless loop and encoded as WAV, so nothing is downloaded and there are no
 * third-party audio licences.
 */

const PCM_MAX = 0x7fff;
const BEATS_PER_BAR = 4;
const BARS_PER_CHORD = 2;
const NOTES_PER_BEAT = 2;
/** Fraction of each string's energy kept per sample; closer to 1 rings longer. */
const STRING_DECAY = 0.9965;
const NOTE_RENDER_SEC = 3.2;
const PLUCK_GAIN = 0.32;
const BASS_GAIN = 0.42;
const WHISTLE_GAIN = 0.07;
const WHISTLE_VIBRATO_HZ = 5.2;
const ECHO_SEC = 0.42;
const ECHO_FEEDBACK = 0.28;
const ECHO_TAPS = 3;
/** One-pole low-pass coefficient: rounds off the pluck attack so nothing sounds harsh. */
const SOFTEN = 0.42;
const PEAK_LEVEL = 0.6;

/** MIDI notes per chord: bass, fifth, octave, third, top. Am – G – F – E. */
const PROGRESSION: readonly (readonly number[])[] = [
  [45, 52, 57, 60, 64],
  [43, 50, 55, 59, 62],
  [41, 48, 53, 57, 60],
  [40, 47, 52, 56, 59],
];
/** Travis-style picking order through the chord voicing, one entry per eighth note. */
const PICK_PATTERN = [0, 2, 3, 4, 1, 3, 2, 4] as const;
/** Whistled phrase: one long note at the start of each chord. */
const WHISTLE = [69, 71, 72, 68] as const;

const midiToHz = (note: number): number => 440 * 2 ** ((note - 69) / 12);

function addWrapped(out: Float32Array, start: number, samples: Float32Array): void {
  for (let i = 0; i < samples.length; i++) {
    const index = (start + i) % out.length;
    out[index] = (out[index] ?? 0) + (samples[i] ?? 0);
  }
}

/** Karplus-Strong plucked string: a short noise burst through a decaying delay line. */
export function pluck(frequency: number, gain: number, random: Random): Float32Array {
  const rate = AUDIO.sampleRate;
  const period = Math.max(2, Math.round(rate / frequency));
  const line = new Float32Array(period);
  let previous = 0;
  for (let i = 0; i < period; i++) {
    previous = previous * 0.5 + (random() * 2 - 1) * 0.5;
    line[i] = previous;
  }
  const out = new Float32Array(Math.floor(NOTE_RENDER_SEC * rate));
  for (let i = 0; i < out.length; i++) {
    const a = line[i % period] ?? 0;
    const b = line[(i + 1) % period] ?? 0;
    out[i] = a * gain;
    line[i % period] = STRING_DECAY * 0.5 * (a + b);
  }
  return out;
}

/** Soft sine "whistle" with vibrato and slow swell, like a distant rider. */
function whistle(frequency: number, seconds: number): Float32Array {
  const rate = AUDIO.sampleRate;
  const out = new Float32Array(Math.floor(seconds * rate));
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / rate;
    const vibrato = 1 + Math.sin(2 * Math.PI * WHISTLE_VIBRATO_HZ * t) * 0.006;
    phase += (2 * Math.PI * frequency * vibrato) / rate;
    const envelope = Math.sin(Math.PI * Math.min(1, t / seconds)) ** 2;
    out[i] = Math.sin(phase) * envelope * WHISTLE_GAIN;
  }
  return out;
}

function renderGuitar(out: Float32Array, random: Random, eighthSamples: number): void {
  const eighthsPerChord = BARS_PER_CHORD * BEATS_PER_BAR * NOTES_PER_BEAT;
  PROGRESSION.forEach((chord, c) => {
    for (let n = 0; n < eighthsPerChord; n++) {
      const voice = PICK_PATTERN[n % PICK_PATTERN.length] ?? 0;
      const note = chord[voice] ?? chord[0] ?? 45;
      const gain = voice === 0 ? BASS_GAIN : PLUCK_GAIN * (0.85 + random() * 0.15);
      addWrapped(
        out,
        (c * eighthsPerChord + n) * eighthSamples,
        pluck(midiToHz(note), gain, random),
      );
    }
  });
}

function renderWhistle(out: Float32Array, eighthSamples: number): void {
  const eighthsPerChord = BARS_PER_CHORD * BEATS_PER_BAR * NOTES_PER_BEAT;
  const seconds = (eighthsPerChord * eighthSamples * 0.75) / AUDIO.sampleRate;
  WHISTLE.forEach((note, c) => {
    addWrapped(out, c * eighthsPerChord * eighthSamples, whistle(midiToHz(note), seconds));
  });
}

/** Feedback echo and a gentle low-pass, both wrapping so the loop stays seamless. */
function addSpaceAndSoften(samples: Float32Array): void {
  const delay = Math.floor(ECHO_SEC * AUDIO.sampleRate);
  const dry = samples.slice();
  for (let tap = 1; tap <= ECHO_TAPS; tap++) {
    const gain = ECHO_FEEDBACK ** tap;
    for (let i = 0; i < dry.length; i++) {
      const index = (i + delay * tap) % samples.length;
      samples[index] = (samples[index] ?? 0) + (dry[i] ?? 0) * gain;
    }
  }
  let state = samples[samples.length - 1] ?? 0;
  for (let i = 0; i < samples.length; i++) {
    state += SOFTEN * ((samples[i] ?? 0) - state);
    samples[i] = state;
  }
}

function normalize(samples: Float32Array): void {
  const peak = samples.reduce((max, s) => Math.max(max, Math.abs(s)), 0);
  if (peak === 0) return;
  const scale = PEAK_LEVEL / peak;
  for (let i = 0; i < samples.length; i++) samples[i] = (samples[i] ?? 0) * scale;
}

/** Length of one full pass through the progression, in samples. */
export function loopLength(): number {
  const eighths = PROGRESSION.length * BARS_PER_CHORD * BEATS_PER_BAR * NOTES_PER_BEAT;
  return eighths * eighthNoteSamples();
}

function eighthNoteSamples(): number {
  return Math.round((60 / AUDIO.tempoBpm / NOTES_PER_BEAT) * AUDIO.sampleRate);
}

/** Render the mono music loop as float samples in [-1, 1]. */
export function synthesizeAmbience(seed: number): Float32Array {
  const random = createRandom(seed);
  const samples = new Float32Array(loopLength());
  renderGuitar(samples, random, eighthNoteSamples());
  renderWhistle(samples, eighthNoteSamples());
  addSpaceAndSoften(samples);
  normalize(samples);
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
      if (playing) {
        sound.play();
        sound.fade(0, AUDIO.volume, AUDIO.fadeMs);
      } else sound.pause();
      return playing;
    },
    dispose: () => {
      howl?.unload();
      if (url) URL.revokeObjectURL(url);
    },
  };
}
