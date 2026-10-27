import type { Job, Portfolio } from '../../content/portfolio';
import { h } from '../component';
import { chipList, panelSection } from './shared';

function ledgerEntry(job: Job): HTMLElement {
  const where = job.location ? ` · ${job.location}` : '';
  return h(
    'article',
    { class: 'ledger-entry' },
    h(
      'header',
      { class: 'ledger-head' },
      h('h3', {}, job.role),
      h('p', { class: 'ledger-meta' }, h('strong', {}, job.company), where),
      h('p', { class: 'ledger-dates typewriter' }, `${job.start} – ${job.end}`),
    ),
    h('ul', { class: 'ledger-lines' }, ...job.achievements.map((line) => h('li', {}, line))),
    chipList(job.tech, `Technologies used at ${job.company}`),
  );
}

/** Sheriff's ledger: one entry per job, newest first as listed in content. */
export function renderExperience(data: Portfolio): HTMLElement {
  return panelSection(
    'experience',
    "Ledger · Sheriff's office",
    'Experience',
    h('div', { class: 'ledger' }, ...data.jobs.map(ledgerEntry)),
  );
}
