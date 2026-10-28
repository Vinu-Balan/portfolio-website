/** Typed access to URL flags used for deep-linking and deterministic test runs. */
export interface QueryFlags {
  readonly mode: 'classic' | 'world' | null;
  /** Freezes clocks and random animation so screenshots are stable. */
  readonly freeze: boolean;
  /** Forces a quality tier (used for screenshots); null lets the device decide. */
  readonly quality: 'low' | 'medium' | 'high' | null;
}

export function readQueryFlags(search: string = window.location.search): QueryFlags {
  const params = new URLSearchParams(search);
  const mode = params.get('mode');
  const quality = params.get('quality');
  return {
    mode: mode === 'classic' || mode === 'world' ? mode : null,
    freeze: params.get('freeze') === '1',
    quality: quality === 'low' || quality === 'medium' || quality === 'high' ? quality : null,
  };
}
