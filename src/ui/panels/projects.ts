import type { Portfolio, Project } from '../../content/portfolio';
import { h } from '../component';
import { chipList, externalLink, panelSection, type PanelRenderOptions } from './shared';

function projectLinks(project: Project): HTMLElement {
  return h(
    'p',
    { class: 'dispatch-links' },
    project.liveUrl ? externalLink(project.liveUrl, `Visit ${project.name}`, 'btn btn-ink') : null,
    project.repoUrl
      ? externalLink(project.repoUrl, `Source for ${project.name}`, 'btn btn-ghost')
      : null,
  );
}

function dispatchVisual(project: Project): HTMLElement {
  if (project.image) {
    return h('img', {
      class: 'dispatch-image',
      src: project.image,
      alt: `Screenshot of ${project.name}`,
      loading: 'lazy',
      width: 640,
      height: 360,
    });
  }
  return h(
    'div',
    { class: 'dispatch-image placeholder', 'aria-hidden': 'true' },
    h('span', {}, project.name),
  );
}

/** "Dispatch" card for one project: visual, summary, stack and links. */
function dispatchCard(project: Project, headingLevel: 'h3' | 'h4' = 'h3'): HTMLElement {
  return h(
    'article',
    { class: 'dispatch', 'data-project': project.id },
    h('p', { class: 'eyebrow' }, 'Dispatch'),
    h(headingLevel, {}, project.name),
    h('p', { class: 'typewriter' }, project.tagline),
    dispatchVisual(project),
    h('ul', { class: 'ledger-lines' }, ...project.description.map((line) => h('li', {}, line))),
    chipList(project.stack, `${project.name} tech stack`),
    projectLinks(project),
  );
}

function selectCar(
  cars: HTMLButtonElement[],
  slot: HTMLElement,
  project: Project,
  index: number,
): void {
  cars.forEach((car, i) => {
    car.setAttribute('aria-pressed', String(i === index));
  });
  slot.replaceChildren(dispatchCard(project));
}

/** A train with one car per project; choosing a car loads its dispatch card. */
function interactiveTrain(projects: readonly Project[]): HTMLElement {
  const slot = h('div', { class: 'dispatch-slot', 'aria-live': 'polite' });
  const cars = projects.map((project, i) =>
    h(
      'button',
      { type: 'button', class: 'train-car', 'aria-pressed': 'false', 'data-car': project.id },
      h('span', { class: 'car-number', 'aria-hidden': 'true' }, `No. ${i + 1}`),
      h('span', { class: 'car-name' }, project.name),
    ),
  );
  cars.forEach((car, i) => {
    const project = projects[i];
    if (project)
      car.addEventListener('click', () => {
        selectCar(cars, slot, project, i);
      });
  });
  const first = projects[0];
  if (first) selectCar(cars, slot, first, 0);
  return h(
    'div',
    { class: 'train' },
    h(
      'div',
      { class: 'train-cars', role: 'group', 'aria-label': 'Project train cars' },
      h('span', { class: 'locomotive', 'aria-hidden': 'true' }),
      ...cars,
    ),
    slot,
  );
}

/** Train station: projects as train cars (interactive) or a stack of dispatches (classic). */
export function renderProjects(data: Portfolio, options: PanelRenderOptions): HTMLElement {
  return panelSection(
    'projects',
    'Dispatches · Train station',
    'Projects',
    options.interactive
      ? interactiveTrain(data.projects)
      : h('div', { class: 'dispatch-stack' }, ...data.projects.map((p) => dispatchCard(p))),
  );
}
