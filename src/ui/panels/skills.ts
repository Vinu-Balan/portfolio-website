import type { Portfolio, Skill, SkillGroup } from '../../content/portfolio';
import { wrapIndex } from '../../utils/math';
import { h } from '../component';
import { chipList, panelSection, type PanelRenderOptions } from './shared';

const METER_SEGMENTS = 10;

function statMeter(skill: Skill): HTMLElement {
  const filled = Math.round((skill.level / 100) * METER_SEGMENTS);
  const segments = Array.from({ length: METER_SEGMENTS }, (_, i) =>
    h('span', { class: i < filled ? 'seg on' : 'seg' }),
  );
  return h(
    'li',
    { class: 'skill-row' },
    h('span', { class: 'skill-name' }, skill.name),
    h(
      'span',
      {
        class: 'stat-meter',
        role: 'meter',
        'aria-label': `${skill.name} proficiency`,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': skill.level,
      },
      ...segments,
    ),
  );
}

/** Headline meters, then the complete resume list for the category as chips. */
function skillList(group: SkillGroup): HTMLElement {
  return h(
    'div',
    { class: 'skill-set' },
    h('ul', { class: 'skill-list' }, ...group.skills.map(statMeter)),
    h('p', { class: 'kit-label typewriter' }, 'Full kit'),
    chipList(group.all, `All ${group.category} skills`),
  );
}

function staticGroups(groups: readonly SkillGroup[]): HTMLElement {
  return h(
    'div',
    { class: 'workbench-flat' },
    ...groups.map((group) =>
      h('div', { class: 'tool-card' }, h('h3', {}, group.category), skillList(group)),
    ),
  );
}

function selectTab(tabs: HTMLButtonElement[], panels: HTMLElement[], index: number): void {
  tabs.forEach((tab, i) => {
    const active = i === index;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[i]?.toggleAttribute('hidden', !active);
  });
}

/** Tools on a workbench: hovering, focusing, or arrowing to a tool reveals its stat meters. */
function interactiveBench(groups: readonly SkillGroup[]): HTMLElement {
  const tabs = groups.map((group, i) =>
    h(
      'button',
      {
        type: 'button',
        role: 'tab',
        id: `tool-tab-${i}`,
        'aria-controls': `tool-panel-${i}`,
        class: 'tool-tab',
      },
      h('span', { class: `tool-icon tool-${group.tool.toLowerCase()}`, 'aria-hidden': 'true' }),
      h('span', { class: 'tool-label' }, group.category),
      h('span', { class: 'tool-count' }, `${group.all.length} skills`),
    ),
  );
  const panels = groups.map((group, i) =>
    h(
      'div',
      {
        role: 'tabpanel',
        id: `tool-panel-${i}`,
        'aria-labelledby': `tool-tab-${i}`,
        class: 'tool-panel',
      },
      skillList(group),
    ),
  );
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      selectTab(tabs, panels, i);
    });
    tab.addEventListener('mouseenter', () => {
      selectTab(tabs, panels, i);
    });
    tab.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (step === 0) return;
      event.preventDefault();
      const next = wrapIndex(i + step, tabs.length);
      selectTab(tabs, panels, next);
      tabs[next]?.focus();
    });
  });
  selectTab(tabs, panels, 0);
  return h(
    'div',
    { class: 'workbench' },
    h('div', { role: 'tablist', 'aria-label': 'Skill tools', class: 'tool-rack' }, ...tabs),
    ...panels,
  );
}

/** Workshop bench of skills with stat-meter proficiency bars. */
export function renderSkills(data: Portfolio, options: PanelRenderOptions): HTMLElement {
  return panelSection(
    'skills',
    'Workbench · Blacksmith',
    'Skills',
    h(
      'p',
      { class: 'muted' },
      options.interactive ? 'Pick up a tool to see what it can do.' : 'Tools of the trade.',
    ),
    options.interactive ? interactiveBench(data.skillGroups) : staticGroups(data.skillGroups),
  );
}
