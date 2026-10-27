import { h, ListenerBag } from './component';

export interface PaperPanel {
  open(content: HTMLElement, returnLabel?: string): void;
  close(): void;
  isOpen(): boolean;
  dispose(): void;
}

export interface PaperPanelOptions {
  readonly root: HTMLElement;
  /** Called after the panel closes, from Esc, the close button, or the backdrop. */
  readonly onClose?: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

function focusableIn(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.closest('[hidden]'),
  );
}

/** Keep Tab cycling inside the open dialog, as expected for a modal. */
function trapTab(event: KeyboardEvent, container: HTMLElement): void {
  const items = focusableIn(container);
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function buildShell(): { dialog: HTMLElement; body: HTMLElement; closeButton: HTMLButtonElement } {
  const closeButton = h(
    'button',
    { type: 'button', class: 'panel-close btn btn-ghost' },
    'Return to map',
  );
  const body = h('div', { class: 'panel-body' });
  const dialog = h(
    'div',
    { class: 'paper-panel', role: 'dialog', 'aria-modal': 'true', hidden: true, tabindex: -1 },
    h('div', { class: 'panel-toolbar' }, closeButton),
    body,
  );
  return { dialog, body, closeButton };
}

/**
 * Paper-textured modal sheet. Content is real DOM, so headings, links and forms work
 * with screen readers exactly as in classic mode.
 */
export function createPaperPanel(options: PaperPanelOptions): PaperPanel {
  const { dialog, body, closeButton } = buildShell();
  const listeners = new ListenerBag();
  let returnFocus: HTMLElement | null = null;
  options.root.append(dialog);

  const isOpen = (): boolean => !dialog.hidden;

  const close = (): void => {
    if (!isOpen()) return;
    dialog.classList.remove('is-open');
    dialog.hidden = true;
    body.replaceChildren();
    returnFocus?.focus();
    options.onClose?.();
  };

  const open = (content: HTMLElement, returnLabel = 'Return to map'): void => {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButton.textContent = returnLabel;
    body.replaceChildren(content);
    const heading = content.querySelector('h2');
    if (heading?.id) dialog.setAttribute('aria-labelledby', heading.id);
    dialog.hidden = false;
    body.scrollTop = 0;
    requestAnimationFrame(() => {
      dialog.classList.add('is-open');
    });
    (heading ?? dialog).setAttribute('tabindex', '-1');
    (heading ?? dialog).focus();
  };

  listeners.on(closeButton, 'click', close);
  listeners.on(dialog, 'keydown', (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    } else if (event.key === 'Tab') trapTab(event, dialog);
  });

  return {
    open,
    close,
    isOpen,
    dispose: () => {
      listeners.dispose();
      dialog.remove();
    },
  };
}
