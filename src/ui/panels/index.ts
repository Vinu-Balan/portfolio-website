import type { Portfolio } from '../../content/portfolio';
import { renderAbout } from './about';
import { renderContact } from './contact';
import { renderExperience } from './experience';
import { renderProjects } from './projects';
import type { PanelId, PanelRenderOptions } from './shared';
import { renderSkills } from './skills';
import { renderWanted } from './wanted';

export type { PanelId } from './shared';

type Renderer = (data: Portfolio, options: PanelRenderOptions) => HTMLElement;

const RENDERERS: Record<PanelId, Renderer> = {
  about: renderAbout,
  experience: renderExperience,
  skills: renderSkills,
  projects: renderProjects,
  contact: renderContact,
  wanted: renderWanted,
};

/** Order used by classic mode, matching a conventional resume. */
export const CLASSIC_ORDER: readonly PanelId[] = [
  'about',
  'experience',
  'projects',
  'skills',
  'contact',
];

/** Render any panel by id. Both the 3D world and classic mode go through here. */
export function renderPanel(
  id: PanelId,
  data: Portfolio,
  options: PanelRenderOptions,
): HTMLElement {
  return RENDERERS[id](data, options);
}
