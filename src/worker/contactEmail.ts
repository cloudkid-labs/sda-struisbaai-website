/// <reference types="@cloudflare/workers-types" />

import type { ContactTopic } from './contact';

export type ContactEmailEnv = {
  BREVO_API_KEY?: string;
  CONTACT_EMAIL_TO?: string;
  CONTACT_EMAIL_FROM?: string;
};

const TOPIC_LABELS: Record<ContactTopic, string> = {
  connect: 'Gebedsversoek',
  'bible-study': 'Bybelstudie',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BREVO_TIMEOUT_MS = 10_000;

function headerSafe(value: string, max: number): string {
  const flattened = value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  return flattened.length > max ? `${flattened.slice(0, max - 1)}…` : flattened;
}

function body(fields: Record<string, string>, submittedAt: string, from: string, recordId?: string): string {
  return [
    'Nuwe versoek vanaf die Struisbaai SDA-webwerf.',
    '',
    `Onderwerp: ${TOPIC_LABELS[fields.topic as ContactTopic] ?? fields.topic}`,
    `Naam: ${fields.name}`,
    `E-pos: ${fields.email || '(nie verskaf nie)'}`,
    `Telefoon: ${fields.phone || '(nie verskaf nie)'}`,
    '',
    'Boodskap:',
    fields.message || '(geen boodskap nie)',
    '',
    'Toestemming gegee: ja',
    `Ontvang: ${submittedAt}`,
    ...(recordId ? [`Toestemmingsrekord: ${recordId}`] : []),
    '',
    '—',
    'Struisbaai SDA Kerk',
    from,
    'Struisbaai Library Hall, Struisbaai',
  ].join('\n');
}

function htmlBody(text: string): string {
  const escaped = text.replace(/[&<>]/g, (character) =>
    character === '&' ? '&amp;' : character === '<' ? '&lt;' : '&gt;',
  );
  return `<pre style="white-space:pre-wrap">${escaped}</pre>`;
}

async function sendToBrevo(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  text: string,
  replyTo?: { email: string; name: string },
): Promise<boolean> {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { email: from, name: 'Struisbaai SDA Kerk' },
        to: [{ email: to }],
        ...(replyTo ? { replyTo } : {}),
        subject,
        textContent: text,
        htmlContent: htmlBody(text),
      }),
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    });
    if (response.ok) return true;
    console.error(`contact send: FAILED status=${response.status}`);
  } catch (error) {
    const code = error instanceof Error ? error.name : 'unknown';
    console.error(`contact send: FAILED code=${code}`);
  }
  return false;
}

export async function sendContactEmail(
  env: ContactEmailEnv,
  fields: Record<string, string>,
  submittedAt: string,
  recordId?: string,
): Promise<boolean> {
  const { BREVO_API_KEY, CONTACT_EMAIL_TO, CONTACT_EMAIL_FROM } = env;
  const recipients = [...new Set(
    (CONTACT_EMAIL_TO ?? '').split(',').map((value) => value.trim()).filter((value) => value.length <= 254 && EMAIL_RE.test(value)),
  )];
  if (!BREVO_API_KEY || !CONTACT_EMAIL_FROM || recipients.length === 0) return false;

  const label = TOPIC_LABELS[fields.topic as ContactTopic] ?? 'Navraag';
  const subject = `${label} — ${headerSafe(fields.name, 60)}`;
  const text = body(fields, submittedAt, CONTACT_EMAIL_FROM, recordId);
  const replyTo = fields.email ? { email: fields.email, name: headerSafe(fields.name, 80) } : undefined;

  console.log(`contact send: start recipients=${recipients.length} topic=${fields.topic}`);
  let notified = 0;
  for (const recipient of recipients) {
    if (await sendToBrevo(BREVO_API_KEY, CONTACT_EMAIL_FROM, recipient, subject, text, replyTo)) notified++;
  }
  console.log(`contact send: notified=${notified} recipients=${recipients.length}`);
  return notified > 0;
}
