import type { Portfolio } from '../../content/portfolio';
import { h, svg } from '../component';
import { panelSection } from './shared';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('');
}

/** Hand-drawn oval frame; shows the portrait if provided, ink initials otherwise. */
function portraitFrame(data: Portfolio): HTMLElement {
  const { portrait, name } = data.profile;
  const inner = portrait
    ? h('img', { src: portrait, alt: `Portrait of ${name}`, width: 160, height: 200 })
    : svg(
        'svg',
        { viewBox: '0 0 160 200', role: 'img', 'aria-label': `Ink monogram for ${name}` },
        svg('ellipse', { cx: 80, cy: 100, rx: 70, ry: 90, class: 'frame-outer' }),
        svg('ellipse', { cx: 80, cy: 100, rx: 62, ry: 82, class: 'frame-inner' }),
        svg(
          'text',
          { x: 80, y: 116, 'text-anchor': 'middle', class: 'frame-initials' },
          initials(name),
        ),
      );
  return h('figure', { class: 'portrait-frame' }, inner);
}

function educationList(data: Portfolio): HTMLElement {
  return h(
    'div',
    { class: 'journal-block' },
    h('h3', {}, 'Schooling'),
    h(
      'ul',
      { class: 'plain-list' },
      ...data.education.map((ed) =>
        h(
          'li',
          {},
          h('strong', {}, ed.degree),
          h('span', { class: 'muted' }, ` — ${ed.school} · ${ed.years}`),
        ),
      ),
    ),
  );
}

function accomplishmentList(data: Portfolio): HTMLElement {
  return h(
    'div',
    { class: 'journal-block' },
    h('h3', {}, 'Bounties & honours'),
    h('ul', { class: 'star-list' }, ...data.accomplishments.map((item) => h('li', {}, item))),
  );
}

/** Campfire journal page: who I am, schooling, and honours. */
export function renderAbout(data: Portfolio): HTMLElement {
  const { profile } = data;
  return panelSection(
    'about',
    'Journal · Campfire camp',
    `About ${profile.shortName}`,
    h(
      'div',
      { class: 'about-header' },
      portraitFrame(data),
      h(
        'div',
        {},
        h('p', { class: 'lede' }, profile.pitch),
        h('p', { class: 'typewriter' }, `${profile.location} · ${profile.availability}`),
      ),
    ),
    ...profile.summary.map((paragraph) => h('p', {}, paragraph)),
    educationList(data),
    accomplishmentList(data),
  );
}
