import { h } from '../component';

export type PanelId = 'about' | 'experience' | 'skills' | 'projects' | 'contact' | 'wanted';

/** Options shared by every panel renderer; classic mode renders the "flat" variant. */
export interface PanelRenderOptions {
  /** Interactive variants (tabs, train cars) are used inside the 3D world; classic expands all. */
  readonly interactive: boolean;
}

/** Section wrapper with a labelled heading so both modes expose identical outlines. */
export function panelSection(
  id: PanelId,
  eyebrow: string,
  title: string,
  ...body: Node[]
): HTMLElement {
  const headingId = `${id}-heading`;
  return h(
    'section',
    { class: `panel-content panel-${id}`, 'aria-labelledby': headingId, 'data-panel': id },
    h('p', { class: 'eyebrow' }, eyebrow),
    h('h2', { id: headingId }, title),
    ...body,
  );
}

/** Small tag chips for tech stacks. */
export function chipList(items: readonly string[], label: string): HTMLElement {
  return h(
    'ul',
    { class: 'chips', 'aria-label': label },
    ...items.map((item) => h('li', {}, item)),
  );
}

/** External link that opens in a new tab safely. */
export function externalLink(
  href: string,
  text: string,
  className = 'ink-link',
): HTMLAnchorElement {
  return h('a', { href, class: className, target: '_blank', rel: 'noopener noreferrer' }, text);
}
