import { UI } from '../config';
import { requireElement } from './component';

let hideTimer: number | undefined;

/** Show a short message in the polite live region (fun facts, mode notices). */
export function showToast(message: string, durationMs: number = UI.toastDurationMs): void {
  const toast = requireElement('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
  }, durationMs);
}
