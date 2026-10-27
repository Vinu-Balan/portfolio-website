/** Typed access to URL flags used for deep-linking and deterministic test runs. */
export interface QueryFlags {
  readonly mode: 'classic' | 'world' | null;
  /** Freezes clocks and random animation so screenshots are stable. */
  readonly freeze: boolean;
}

export function readQueryFlags(search: string = window.location.search): QueryFlags {
  const params = new URLSearchParams(search);
  const mode = params.get('mode');
  return {
    mode: mode === 'classic' || mode === 'world' ? mode : null,
    freeze: params.get('freeze') === '1',
  };
}
