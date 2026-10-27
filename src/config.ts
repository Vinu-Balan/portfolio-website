/** Named constants shared across the app. Tune visuals and budgets here, not inline. */

export const PALETTE = {
  dayHorizon: 0xf3c98b,
  dayZenith: 0x7fa6c4,
  duskHorizon: 0xe2793f,
  duskZenith: 0x2b2a4a,
  daySun: 0xfff1d6,
  duskSun: 0xff9a52,
  dayFog: 0xf0cf9f,
  duskFog: 0xb47a62,
  dayAmbient: 0xffe2b8,
  duskAmbient: 0x6b4a6e,
  sand: 0xc9a46a,
  sage: 0x8f9a5b,
  rock: 0x8a6a52,
  mountain: 0x6a4a52,
  wood: 0x7a4e2d,
  woodDark: 0x4e3020,
  roof: 0x5b3a2a,
  metal: 0x3d3b3a,
  brass: 0xb08a3e,
  canvas: 0xe8dcc0,
  ember: 0xffa040,
  grassBase: 0x6f7a3a,
  grassTip: 0xd8c27a,
} as const;

export const WORLD = {
  terrainSize: 420,
  terrainSegments: 96,
  valleyRadius: 70,
  mountainHeight: 46,
  mountainRingRadius: 170,
  mountainCount: 28,
  landmarkRingRadius: 34,
  seed: 1873,
} as const;

export const CAMERA = {
  fov: 45,
  near: 0.5,
  far: 900,
  overviewPosition: [0, 62, 92] as const,
  overviewTarget: [0, 0, 0] as const,
  /** Title view, relative to the campfire landmark's base. */
  titleOffset: [-5, 5.6, 11.5] as const,
  titleTargetOffset: [7, 2.5, -42] as const,
  landmarkDistance: 28,
  landmarkHeight: 12,
  flyDurationSec: 1.8,
  breathAmplitude: 0.18,
  breathSpeed: 0.35,
} as const;

export const LIGHTING = {
  /** Seconds for a full day→dusk→day round trip. Long so the change reads as ambient. */
  cyclePeriodSec: 180,
  sunIntensityDay: 2.8,
  sunIntensityDusk: 1.6,
  ambientIntensityDay: 1.5,
  ambientIntensityDusk: 0.95,
  fogDensityDay: 0.0026,
  fogDensityDusk: 0.0042,
  campfireLightIntensity: 26,
  campfireLightDistance: 26,
} as const;

export interface QualityTier {
  readonly name: 'low' | 'medium' | 'high';
  readonly maxPixelRatio: number;
  readonly shadowMapSize: number;
  readonly shadows: boolean;
  readonly emberCount: number;
  readonly grassCount: number;
  readonly postFx: boolean;
}

export const QUALITY_TIERS: readonly QualityTier[] = [
  {
    name: 'low',
    maxPixelRatio: 1,
    shadowMapSize: 512,
    shadows: false,
    emberCount: 60,
    grassCount: 2500,
    postFx: false,
  },
  {
    name: 'medium',
    maxPixelRatio: 1.5,
    shadowMapSize: 1024,
    shadows: true,
    emberCount: 140,
    grassCount: 7000,
    postFx: true,
  },
  {
    name: 'high',
    maxPixelRatio: 2,
    shadowMapSize: 2048,
    shadows: true,
    emberCount: 240,
    grassCount: 14000,
    postFx: true,
  },
];

export const PERF = {
  sampleWindowSec: 2,
  downgradeBelowFps: 45,
  upgradeAboveFps: 58,
  upgradeStreakRequired: 3,
  probeDurationMs: 1500,
  classicFallbackBelowFps: 22,
  lowMemoryGb: 2,
  lowCoreCount: 2,
  minTextureSize: 4096,
} as const;

export const ATMOSPHERE = {
  tumbleweedIntervalSec: 22,
  tumbleweedDurationSec: 11,
  tumbleweedRadius: 1.1,
  emberRiseSpeed: 1.6,
  emberSpread: 1.4,
  emberMaxHeight: 9,
  grassFieldRadius: 95,
  grassBladeHeight: 1.1,
  windStrength: 0.35,
  starCount: 900,
  grainAmount: 0.035,
  vignetteStrength: 0.45,
  sepiaAmount: 0.14,
} as const;

export const UI = {
  panelTransitionSec: 0.45,
  toastDurationMs: 5200,
  loaderMinVisibleMs: 600,
} as const;

export const AUDIO = {
  loopSeconds: 12,
  sampleRate: 22050,
  volume: 0.5,
} as const;
