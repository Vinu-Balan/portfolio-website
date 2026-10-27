import { UI } from '../config';
import { clamp } from '../utils/math';
import { requireElement } from './component';

export interface Loader {
  /** Progress in [0,1]; drives the ink sketch stroke by stroke. */
  setProgress(progress: number): void;
  /** Fade out and remove from the accessibility tree. */
  finish(): Promise<void>;
}

/** Each path draws during its own slice of the progress range, so strokes appear in order. */
function drawStrokes(paths: readonly SVGPathElement[], progress: number): void {
  const count = paths.length;
  paths.forEach((path, i) => {
    const local = clamp(progress * count - i, 0, 1);
    path.style.strokeDashoffset = String(1 - local);
  });
}

/** Wrap the server-rendered loader in index.html. */
export function mountLoader(): Loader {
  const root = requireElement('#loader');
  const label = requireElement('#loader-percent');
  const paths = [...root.querySelectorAll<SVGPathElement>('path')];
  const shownAt = performance.now();
  let current = 0;

  const setProgress = (progress: number): void => {
    current = Math.max(current, clamp(progress, 0, 1));
    const percent = Math.round(current * 100);
    drawStrokes(paths, current);
    label.textContent = `${percent}%`;
    root.setAttribute('aria-valuenow', String(percent));
  };

  const finish = async (): Promise<void> => {
    setProgress(1);
    const remaining = UI.loaderMinVisibleMs - (performance.now() - shownAt);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
    root.classList.add('is-done');
    root.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      root.remove();
    }, UI.panelTransitionSec * 1000);
  };

  setProgress(0);
  return { setProgress, finish };
}
