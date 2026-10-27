export interface TelegramFields {
  readonly name: string;
  readonly email: string;
  readonly message: string;
}

export type FieldErrors = Partial<Record<keyof TelegramFields, string>>;

/** Pragmatic check: something@something.tld, no spaces. Real validation happens at the inbox. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_MESSAGE_LENGTH = 10;

/** Validate the telegram form; returns an empty object when everything is fine. */
export function validateTelegram(fields: TelegramFields): FieldErrors {
  const errors: FieldErrors = {};
  if (fields.name.trim() === '') errors.name = 'Please sign your name.';
  if (fields.email.trim() === '') errors.email = 'Where should the reply be sent?';
  else if (!EMAIL_PATTERN.test(fields.email.trim()))
    errors.email = 'That address looks off. Check for typos.';
  if (fields.message.trim().length < MIN_MESSAGE_LENGTH)
    errors.message = `A telegram needs at least ${MIN_MESSAGE_LENGTH} characters.`;
  return errors;
}

/** Build a mailto: URL used when no Formspree form is configured. */
export function buildMailto(to: string, fields: TelegramFields): string {
  const subject = encodeURIComponent(`Telegram from ${fields.name.trim()}`);
  const body = encodeURIComponent(
    `${fields.message.trim()}\n\n- ${fields.name.trim()} (${fields.email.trim()})`,
  );
  return `mailto:${to}?subject=${subject}&body=${body}`;
}
