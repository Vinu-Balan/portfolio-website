import type { Portfolio } from '../content/portfolio';
import type { ClassicReason } from '../utils/device';
import { assetUrl, h } from './component';
import { CLASSIC_ORDER, renderPanel, type PanelId } from './panels';
import { resumeFileName } from './panels/wanted';

export interface ClassicOptions {
  readonly root: HTMLElement;
  readonly data: Portfolio;
  readonly reason: ClassicReason | null;
  /** In-page switch back to the 3D world; when absent we offer a ?mode=world link instead. */
  readonly onEnterWorld?: () => void;
  readonly worldAvailable: boolean;
}

const NAV_LABELS: Record<PanelId, string> = {
  about: 'About',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  contact: 'Contact',
  wanted: 'Resume',
};

const REASON_COPY: Record<ClassicReason, string> = {
  requested: '',
  'reduced-motion': 'Showing the journal because your system prefers reduced motion.',
  'no-webgl': 'Showing the journal because 3D graphics are unavailable in this browser.',
  'low-end': 'Showing the journal to keep things quick on this device.',
  'slow-fps': 'The 3D world was running slowly, so here is the journal instead.',
};

function worldControl(options: ClassicOptions): HTMLElement | null {
  if (options.onEnterWorld) {
    const button = h(
      'button',
      { type: 'button', class: 'btn btn-ghost' },
      'Return to the 3D world',
    );
    button.addEventListener('click', options.onEnterWorld);
    return button;
  }
  if (!options.worldAvailable) return null;
  return h('a', { href: '?mode=world', class: 'btn btn-ghost' }, 'Enter the 3D world');
}

function cover(options: ClassicOptions): HTMLElement {
  const { data } = options;
  const notice = options.reason ? REASON_COPY[options.reason] : '';
  return h(
    'header',
    { class: 'journal-cover' },
    h('p', { class: 'eyebrow' }, 'The journal of'),
    h('h1', { tabindex: -1 }, data.profile.name),
    h('p', { class: 'journal-title' }, data.profile.title),
    h('p', { class: 'lede' }, data.profile.pitch),
    h(
      'p',
      { class: 'journal-actions' },
      h(
        'a',
        { href: assetUrl(data.resumeFile), download: resumeFileName(data), class: 'btn btn-ink' },
        'Download resume (PDF)',
      ),
      worldControl(options),
    ),
    notice ? h('p', { class: 'muted small' }, notice) : null,
  );
}

function sectionNav(): HTMLElement {
  return h(
    'nav',
    { class: 'journal-nav', 'aria-label': 'Journal sections' },
    h(
      'ul',
      {},
      ...CLASSIC_ORDER.map((id) => h('li', {}, h('a', { href: `#journal-${id}` }, NAV_LABELS[id]))),
    ),
  );
}

/** Accessible, motion-free rendering of 100% of the content as one scrolling journal. */
export function mountClassic(options: ClassicOptions): { dispose: () => void } {
  const { root, data } = options;
  const sections = CLASSIC_ORDER.map((id) =>
    h(
      'div',
      { id: `journal-${id}`, class: 'journal-page' },
      renderPanel(id, data, { interactive: false }),
    ),
  );
  const journal = h(
    'div',
    { class: 'journal', 'data-mode': 'classic' },
    cover(options),
    sectionNav(),
    ...sections,
    h(
      'footer',
      { class: 'journal-footer' },
      h(
        'p',
        { class: 'muted small' },
        `© ${new Date().getFullYear()} ${data.profile.name}. Hand-built frontier, no outlaws harmed.`,
      ),
    ),
  );
  document.body.classList.add('is-classic');
  root.replaceChildren(journal);
  return {
    dispose: () => {
      journal.remove();
      document.body.classList.remove('is-classic');
    },
  };
}
