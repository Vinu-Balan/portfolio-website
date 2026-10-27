/** Ease-in-out cubic, used for non-GSAP interpolations (lighting cycle). */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Maps a looping phase in [0,1) to a 0→1→0 triangle wave, eased at the ends. */
export function pingPong(phase: number): number {
  const p = phase - Math.floor(phase);
  return easeInOutCubic(p < 0.5 ? p * 2 : 2 - p * 2);
}
