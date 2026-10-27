import type { Portfolio } from '../../content/portfolio';
import {
  buildMailto,
  validateTelegram,
  type FieldErrors,
  type TelegramFields,
} from '../../utils/validation';
import { h } from '../component';
import { externalLink, panelSection } from './shared';

type FieldName = keyof TelegramFields;
type Outcome = 'sent' | 'mailto' | 'failed';

const FIELD_NAMES: readonly FieldName[] = ['name', 'email', 'message'];

const STATUS_COPY: Record<Outcome, string> = {
  sent: 'Telegram sent. Expect a reply soon. STOP.',
  mailto: 'Your mail client is opening with the telegram ready to send. STOP.',
  failed: 'The line is down. Please email directly using the address below. STOP.',
};

function field(
  name: FieldName,
  label: string,
  control: HTMLInputElement | HTMLTextAreaElement,
): HTMLElement {
  const errorId = `tg-${name}-error`;
  control.id = `tg-${name}`;
  control.name = name;
  control.setAttribute('aria-describedby', errorId);
  return h(
    'div',
    { class: 'tg-field' },
    h('label', { for: control.id }, label),
    control,
    h('p', { class: 'tg-error', id: errorId, 'data-error-for': name }),
  );
}

function readFields(form: HTMLFormElement): TelegramFields {
  const data = new FormData(form);
  const read = (key: FieldName): string => {
    const value = data.get(key);
    return typeof value === 'string' ? value : '';
  };
  return { name: read('name'), email: read('email'), message: read('message') };
}

function showErrors(form: HTMLFormElement, errors: FieldErrors): void {
  for (const name of FIELD_NAMES) {
    const message = errors[name] ?? '';
    const control = form.elements.namedItem(name);
    const slot = form.querySelector(`[data-error-for="${name}"]`);
    if (slot) slot.textContent = message;
    if (control instanceof HTMLElement)
      control.setAttribute('aria-invalid', String(message !== ''));
  }
  const firstInvalid = FIELD_NAMES.find((name) => errors[name] !== undefined);
  if (firstInvalid) {
    const control = form.elements.namedItem(firstInvalid);
    if (control instanceof HTMLElement) control.focus();
  }
}

async function sendViaFormspree(formspreeId: string, fields: TelegramFields): Promise<boolean> {
  const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(fields),
  });
  return response.ok;
}

/** Deliver via Formspree when configured; otherwise hand off to the visitor's mail client. */
async function deliver(data: Portfolio, fields: TelegramFields): Promise<Outcome> {
  const { formspreeId, email } = data.contact;
  if (formspreeId === '') {
    window.open(buildMailto(email, fields), '_self');
    return 'mailto';
  }
  try {
    return (await sendViaFormspree(formspreeId, fields)) ? 'sent' : 'failed';
  } catch {
    return 'failed';
  }
}

interface FormParts {
  readonly form: HTMLFormElement;
  readonly submit: HTMLButtonElement;
  readonly status: HTMLElement;
}

async function handleSubmit(parts: FormParts, data: Portfolio): Promise<void> {
  const { form, submit, status } = parts;
  const fields = readFields(form);
  const errors = validateTelegram(fields);
  showErrors(form, errors);
  status.textContent = '';
  if (Object.keys(errors).length > 0) return;
  submit.disabled = true;
  const outcome = await deliver(data, fields);
  submit.disabled = false;
  status.textContent = STATUS_COPY[outcome];
  status.dataset.outcome = outcome;
  if (outcome !== 'failed') form.reset();
}

function telegramForm(data: Portfolio): HTMLFormElement {
  const status = h('p', { class: 'tg-status', role: 'status', 'aria-live': 'polite' });
  const submit = h('button', { type: 'submit', class: 'btn btn-ink' }, 'Send telegram');
  const form = h(
    'form',
    { class: 'telegram', novalidate: true, 'aria-label': 'Send a telegram' },
    h('p', { class: 'telegram-head typewriter', 'aria-hidden': 'true' }, 'WESTERN WIRE · TELEGRAM'),
    field('name', 'Your name', h('input', { type: 'text', autocomplete: 'name', required: true })),
    field(
      'email',
      'Reply-to email',
      h('input', { type: 'email', autocomplete: 'email', required: true }),
    ),
    field('message', 'Message', h('textarea', { rows: 5, required: true })),
    submit,
    status,
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleSubmit({ form, submit, status }, data);
  });
  return form;
}

/** Telegraph office: telegram-styled contact form plus direct links. */
export function renderContact(data: Portfolio): HTMLElement {
  const { contact } = data;
  return panelSection(
    'contact',
    'Wire · Telegraph office',
    'Send a Telegram',
    h('p', {}, `Hiring, collaborating, or just saying howdy? ${data.profile.availability}.`),
    telegramForm(data),
    h(
      'ul',
      { class: 'contact-links' },
      h('li', {}, h('a', { href: `mailto:${contact.email}`, class: 'ink-link' }, contact.email)),
      h('li', {}, externalLink(contact.linkedin, 'LinkedIn')),
      h('li', {}, externalLink(contact.github, 'GitHub')),
    ),
  );
}
