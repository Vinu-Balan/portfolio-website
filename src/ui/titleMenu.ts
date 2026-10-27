import type { Portfolio } from '../content/portfolio';
import { h } from './component';

export type TitleAction = 'journey' | 'journal' | 'wanted' | 'telegram';

export interface TitleMenu {
  readonly element: HTMLElement;
  show(): void;
  hide(): void;
}

const ITEMS: readonly { action: TitleAction; label: string; hint: string }[] = [
  { action: 'journey', label: 'Begin the Journey', hint: 'Explore the 3D frontier' },
  { action: 'journal', label: 'Read the Journal', hint: 'Classic, accessible view' },
  { action: 'wanted', label: 'Wanted Poster', hint: 'Resume & download' },
  { action: 'telegram', label: 'Send a Telegram', hint: 'Contact' },
];

/** Title screen menu laid over the campfire scene. */
export function createTitleMenu(
  data: Portfolio,
  onAction: (action: TitleAction) => void,
): TitleMenu {
  const buttons = ITEMS.map((item) => {
    const button = h(
      'button',
      { type: 'button', class: 'menu-item', 'data-action': item.action },
      h('span', { class: 'menu-label' }, item.label),
      h('span', { class: 'menu-hint' }, item.hint),
    );
    button.addEventListener('click', () => {
      onAction(item.action);
    });
    return h('li', {}, button);
  });
  const element = h(
    'section',
    { class: 'title-menu', 'aria-labelledby': 'title-name', hidden: true },
    h('p', { class: 'eyebrow' }, 'A frontier portfolio'),
    h('h1', { id: 'title-name', class: 'title-name' }, data.profile.name),
    h('p', { class: 'title-role' }, data.profile.title),
    h('p', { class: 'title-pitch' }, data.profile.pitch),
    h('nav', { 'aria-label': 'Main menu' }, h('ul', { class: 'menu' }, ...buttons)),
  );
  return {
    element,
    show: () => {
      element.hidden = false;
      element.querySelector<HTMLButtonElement>('.menu-item')?.focus({ preventScroll: true });
    },
    hide: () => {
      element.hidden = true;
    },
  };
}
