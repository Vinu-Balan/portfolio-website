import type { Portfolio } from '../content/portfolio';
import { h, svg } from './component';

export interface HudLandmark {
  readonly id: string;
  readonly label: string;
  readonly section: string;
  /** World-space x/z; projected onto the compass minimap. */
  readonly x: number;
  readonly z: number;
}

export interface HudCallbacks {
  readonly onSelect: (id: string) => void;
  readonly onOpen: (id: string) => void;
  readonly onStep: (direction: 1 | -1) => void;
  readonly onResume: () => void;
  readonly onJournal: () => void;
  readonly onToggleSound: () => void;
  readonly onTitle: () => void;
}

export interface Hud {
  readonly element: HTMLElement;
  setSelected(id: string): void;
  setSoundOn(on: boolean): void;
  show(): void;
  hide(): void;
}

const COMPASS_RADIUS = 44;
const COMPASS_CENTER = 60;

function compassDot(
  landmark: HudLandmark,
  maxDistance: number,
  onSelect: (id: string) => void,
): SVGElement {
  const scale = COMPASS_RADIUS / maxDistance;
  const dot = svg(
    'g',
    { class: 'compass-dot', 'data-dot': landmark.id },
    svg('circle', {
      cx: COMPASS_CENTER + landmark.x * scale,
      cy: COMPASS_CENTER + landmark.z * scale,
      r: 5,
    }),
  );
  dot.addEventListener('click', () => {
    onSelect(landmark.id);
  });
  return dot;
}

function compass(landmarks: readonly HudLandmark[], onSelect: (id: string) => void): HTMLElement {
  const maxDistance = Math.max(...landmarks.map((l) => Math.hypot(l.x, l.z)), 1);
  const rose = svg(
    'svg',
    {
      viewBox: '0 0 120 120',
      class: 'compass',
      role: 'img',
      'aria-label': 'Compass minimap of landmarks',
    },
    svg('circle', { cx: 60, cy: 60, r: 56, class: 'compass-ring' }),
    svg('circle', { cx: 60, cy: 60, r: 50, class: 'compass-ring inner' }),
    svg('path', { d: 'M60 8 L65 60 L60 112 L55 60 Z', class: 'compass-needle' }),
    svg('text', { x: 60, y: 22, 'text-anchor': 'middle', class: 'compass-n' }, 'N'),
    ...landmarks.map((l) => compassDot(l, maxDistance, onSelect)),
  );
  return h('div', { class: 'hud-compass' }, rose);
}

function hudButton(
  label: string,
  onClick: () => void,
  attrs: Record<string, string> = {},
): HTMLButtonElement {
  const button = h('button', { type: 'button', class: 'hud-btn', ...attrs }, label);
  button.addEventListener('click', onClick);
  return button;
}

function landmarkNavigator(callbacks: HudCallbacks): {
  element: HTMLElement;
  label: HTMLElement;
  open: HTMLButtonElement;
} {
  const label = h('span', { class: 'hud-current', 'aria-live': 'polite' });
  const open = hudButton('Open', () => undefined, { class: 'hud-btn hud-open' });
  const element = h(
    'div',
    { class: 'hud-nav', role: 'group', 'aria-label': 'Landmark navigation' },
    hudButton(
      '◀',
      () => {
        callbacks.onStep(-1);
      },
      { 'aria-label': 'Previous landmark' },
    ),
    label,
    hudButton(
      '▶',
      () => {
        callbacks.onStep(1);
      },
      { 'aria-label': 'Next landmark' },
    ),
    open,
    h(
      'span',
      { class: 'hud-keys', 'aria-hidden': 'true' },
      '←/→ or A/D · Enter opens · Esc closes',
    ),
  );
  return { element, label, open };
}

function topBar(data: Portfolio, callbacks: HudCallbacks, sound: HTMLButtonElement): HTMLElement {
  const brand = h(
    'button',
    { type: 'button', class: 'hud-brand', 'aria-label': 'Back to title screen' },
    h('span', { class: 'hud-name' }, data.profile.name),
    h('span', { class: 'hud-role' }, data.profile.title),
  );
  brand.addEventListener('click', callbacks.onTitle);
  return h(
    'div',
    { class: 'hud-top' },
    brand,
    h(
      'div',
      { class: 'hud-actions' },
      hudButton('Resume', callbacks.onResume, { class: 'hud-btn hud-resume' }),
      hudButton('Journal', callbacks.onJournal),
      sound,
    ),
  );
}

/** Map HUD: brand, quick actions, compass minimap, and landmark navigator. */
export function createHud(
  data: Portfolio,
  landmarks: readonly HudLandmark[],
  callbacks: HudCallbacks,
): Hud {
  const sound = hudButton('Sound: off', callbacks.onToggleSound, {
    'aria-pressed': 'false',
    'data-testid': 'sound-toggle',
  });
  const nav = landmarkNavigator(callbacks);
  let selected = landmarks[0]?.id ?? '';
  nav.open.addEventListener('click', () => {
    callbacks.onOpen(selected);
  });
  const element = h(
    'div',
    { class: 'hud', hidden: true },
    topBar(data, callbacks, sound),
    compass(landmarks, callbacks.onSelect),
    nav.element,
  );
  return {
    element,
    setSelected: (id) => {
      selected = id;
      const landmark = landmarks.find((l) => l.id === id);
      nav.label.textContent = landmark ? `${landmark.label} · ${landmark.section}` : '';
      nav.open.setAttribute('aria-label', landmark ? `Open ${landmark.section}` : 'Open');
      element.querySelectorAll('[data-dot]').forEach((dot) => {
        dot.classList.toggle('is-active', dot.getAttribute('data-dot') === id);
      });
    },
    setSoundOn: (on) => {
      sound.textContent = on ? 'Sound: on' : 'Sound: off';
      sound.setAttribute('aria-pressed', String(on));
    },
    show: () => {
      element.hidden = false;
    },
    hide: () => {
      element.hidden = true;
    },
  };
}
