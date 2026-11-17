import { strict as assert } from 'node:assert';
import { test, describe, beforeEach, afterEach } from 'node:test';
import { sendContactEmail } from '../src/worker/contactEmail.ts';

const AT = '2026-09-20T10:00:00.000Z';
const FROM = 'website@sdastruisbaai.co.za';
const TO = 'one@example.co.za,two@example.co.za';
const fields = (over = {}) => ({
  topic: 'connect',
  name: 'Jan van Wyk',
  email: 'jan@example.co.za',
  phone: '',
  message: 'Hallo, ek wil graag meer weet.',
  ...over,
});
const baseEnv = (over = {}) => ({
  BREVO_API_KEY: 'test-api-key',
  CONTACT_EMAIL_TO: TO,
  CONTACT_EMAIL_FROM: FROM,
  ...over,
});

let calls;
let logged;
let errored;
const realFetch = globalThis.fetch;
const realLog = console.log;
const realError = console.error;

beforeEach(() => {
  calls = [];
  logged = [];
  errored = [];
  console.log = (...args) => logged.push(args.join(' '));
  console.error = (...args) => errored.push(args.join(' '));
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), 'https://api.brevo.com/v3/smtp/email');
    calls.push({ headers: init.headers, body: JSON.parse(init.body) });
    return Response.json({ messageId: '<test@example.com>' }, { status: 201 });
  };
});

afterEach(() => {
  console.log = realLog;
  console.error = realError;
  globalThis.fetch = realFetch;
});

describe('sendContactEmail configuration', () => {
  test('does not call Brevo when any required value is missing', async () => {
    assert.equal(await sendContactEmail(baseEnv({ BREVO_API_KEY: undefined }), fields(), AT), false);
    assert.equal(await sendContactEmail(baseEnv({ CONTACT_EMAIL_TO: undefined }), fields(), AT), false);
    assert.equal(await sendContactEmail(baseEnv({ CONTACT_EMAIL_FROM: undefined }), fields(), AT), false);
    assert.equal(calls.length, 0);
  });

  test('sends each recipient separately with Struisbaai copy and reply-to', async () => {
    assert.equal(await sendContactEmail(baseEnv(), fields(), AT, 'rec-123'), true);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls.map((call) => call.body.to), [[{ email: 'one@example.co.za' }], [{ email: 'two@example.co.za' }]]);
    assert.ok(calls.every((call) => call.headers['api-key'] === 'test-api-key'));
    const mail = calls[0].body;
    assert.deepEqual(mail.sender, { email: FROM, name: 'Struisbaai SDA Kerk' });
    assert.deepEqual(mail.replyTo, { email: 'jan@example.co.za', name: 'Jan van Wyk' });
    assert.match(mail.subject, /Gebedsversoek/);
    assert.match(mail.textContent, /Hallo, ek wil graag meer weet\./);
    assert.match(mail.textContent, /Toestemming gegee: ja/);
    assert.match(mail.textContent, /Toestemmingsrekord: rec-123/);
    assert.match(mail.textContent, /Struisbaai SDA Kerk/);
    assert.match(mail.textContent, /website@sdastruisbaai\.co\.za/);
  });

  test('escapes visitor text in the HTML alternative', async () => {
    await sendContactEmail(baseEnv({ CONTACT_EMAIL_TO: 'one@example.co.za' }), fields({ message: '<script>alert(1)</script> & pray' }), AT);
    assert.match(calls[0].body.htmlContent, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; pray/);
    assert.doesNotMatch(calls[0].body.htmlContent, /<script>/);
  });

  test('uses the study label and omits reply-to for phone-only requests', async () => {
    await sendContactEmail(baseEnv({ CONTACT_EMAIL_TO: 'one@example.co.za' }), fields({ topic: 'bible-study', email: '' }), AT);
    assert.match(calls[0].body.subject, /Bybelstudie/);
    assert.ok(!('replyTo' in calls[0].body));
  });

  test('deduplicates and ignores invalid configured recipients', async () => {
    await sendContactEmail(baseEnv({ CONTACT_EMAIL_TO: ' one@example.co.za, bad, one@example.co.za ' }), fields(), AT);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].body.to, [{ email: 'one@example.co.za' }]);
  });
});

describe('sendContactEmail delivery failures', () => {
  test('keeps a partial success when one recipient fails', async () => {
    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(init.body);
      calls.push({ body });
      return new Response('', { status: body.to[0].email === 'two@example.co.za' ? 500 : 201 });
    };
    assert.equal(await sendContactEmail(baseEnv(), fields(), AT), true);
    assert.equal(calls.length, 2);
  });

  test('returns false when Brevo rejects all recipients and logs no submission data', async () => {
    globalThis.fetch = async (_url, init) => {
      calls.push({ body: JSON.parse(init.body) });
      return new Response('', { status: 401 });
    };
    assert.equal(await sendContactEmail(baseEnv({ CONTACT_EMAIL_TO: 'one@example.co.za' }), fields(), AT), false);
    assert.match(errored.join('\n'), /FAILED status=401/);
    assert.doesNotMatch(errored.join('\n'), /jan@example\.co\.za|Hallo/);
  });

  test('flattens CR/LF in subject names', async () => {
    await sendContactEmail(baseEnv({ CONTACT_EMAIL_TO: 'one@example.co.za' }), fields({ name: 'Jan\r\nBcc: evil@example.com' }), AT);
    assert.doesNotMatch(calls[0].body.subject, /[\r\n]/);
  });
});
