import type { Portfolio } from '../../content/portfolio';
import { assetUrl, h } from '../component';
import { panelSection } from './shared';

const HIGHLIGHT_COUNT = 3;

/** Download file name derived from the profile, e.g. "Vinu_Balan_J_Resume.pdf". */
export function resumeFileName(data: Portfolio): string {
  return `${data.profile.name.replace(/\s+/g, '_')}_Resume.pdf`;
}

/** Resume as a wanted poster: the quickest path for recruiters to the PDF. */
export function renderWanted(data: Portfolio): HTMLElement {
  const { profile } = data;
  const highlights = data.accomplishments.slice(0, HIGHLIGHT_COUNT);
  return panelSection(
    'wanted',
    'Resume',
    'Wanted Poster',
    h(
      'div',
      { class: 'poster' },
      h('p', { class: 'poster-wanted', 'aria-hidden': 'true' }, 'WANTED'),
      h('p', { class: 'poster-sub' }, 'for hire'),
      h('p', { class: 'poster-name' }, profile.name),
      h('p', { class: 'poster-title' }, profile.title),
      h('ul', { class: 'poster-list' }, ...highlights.map((item) => h('li', {}, item))),
      h('p', { class: 'poster-reward' }, `Reward: a great engineer · ${profile.availability}`),
      h(
        'p',
        { class: 'poster-actions' },
        h(
          'a',
          {
            href: assetUrl(data.resumeFile),
            download: resumeFileName(data),
            class: 'btn btn-ink',
            'data-testid': 'resume-download',
          },
          'Download resume (PDF)',
        ),
        h(
          'a',
          {
            href: assetUrl(data.resumeFile),
            target: '_blank',
            rel: 'noopener',
            class: 'btn btn-ghost',
          },
          'View in browser',
        ),
      ),
    ),
  );
}
