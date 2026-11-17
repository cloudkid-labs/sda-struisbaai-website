import { strict as assert } from 'node:assert';
import { test, describe, beforeEach, afterEach } from 'node:test';
import { handleContact } from '../src/worker/contact.ts';

/*
 * Delivery order is email first, webhook fallback, one channel per submission —
 * C-31. Consent is stored before delivery and never blocks it — C-34. The form
 * reports not-configured rather than pretending — C-19.
 */

const goodBody = (over = {}) => ({
  topic: 'connect',
  name: 'Jan',
  email: 'jan@example.co.za',
  phone: '',
  message: 'Hallo',
  consent: true,
  ...over,
});

const post = (body, headers = {}) =>
  new Request('https://x/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

function emailEnv(over = {}) {
  return {
    sent: brevoCalls,
    env: {
      BREVO_API_KEY: 'test-api-key',
      CONTACT_EMAIL_TO: 'to@church.test',
      CONTACT_EMAIL_FROM: 'from@church.test',
      ...over,
    },
  };
}

function r2() {
  const puts = [];
  return {
    puts,
    bucket: {
      async put(key, body, options) {
        puts.push({ key, body, options });
      },
    },
  };
}

const realFetch = globalThis.fetch;
const realLog = console.log;
const realError = console.error;
let logged;
let errored;
let webhookCalls;
let brevoCalls;

beforeEach(() => {
  logged = [];
  errored = [];
  webhookCalls = [];
  brevoCalls = [];
  console.log = (...args) => logged.push(args.join(' '));
  console.error = (...args) => errored.push(args.join(' '));
  globalThis.fetch = async (url, init) => {
    if (String(url) === 'https://api.brevo.com/v3/smtp/email') {
      brevoCalls.push({ url: String(url), body: JSON.parse(init.body) });
      return Response.json({ messageId: '<test@example.com>' }, { status: 201 });
    }
    return realFetch(url, init);
  };
});

afterEach(() => {
  console.log = realLog;
  console.error = realError;
  globalThis.fetch = realFetch;
});

/** Brevo, webhook, and Turnstile responses are captured without network access. */
function mockNet({ webhookOk = true, webhookThrows = false, brevoOk = true, brevoThrows = false } = {}) {
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u === 'https://api.brevo.com/v3/smtp/email') {
      brevoCalls.push({ url: u, body: JSON.parse(init.body) });
      if (brevoThrows) throw new Error('Brevo unavailable');
      return Response.json({}, { status: brevoOk ? 201 : 500 });
    }
    if (u.includes('challenges.cloudflare.com')) {
      return Response.json({ success: true, action: 'contact' });
    }
    webhookCalls.push({ url: u, body: init?.body });
    if (webhookThrows) throw new Error('net down');
    return new Response('ok', { status: webhookOk ? 200 : 500 });
  };
}

describe('handleContact transport guards', () => {
  test('rejects non-POST with 405', async () => {
    const res = await handleContact(new Request('https://x/api/contact'), {});
    assert.equal(res.status, 405);
    assert.deepEqual((await res.json()).errors, ['method']);
  });

  test('413 when the declared body is oversize', async () => {
    const res = await handleContact(post(goodBody(), { 'content-length': '999999' }), {});
    assert.equal(res.status, 413);
  });

  test('413 when the measured body is oversize', async () => {
    const res = await handleContact(post({ ...goodBody(), message: 'x'.repeat(17 * 1024) }), {});
    assert.equal(res.status, 413);
  });

  test('400 on malformed JSON, arrays, and non-objects', async () => {
    for (const raw of ['{broken', '[1,2]', '"str"', '42']) {
      const res = await handleContact(post(raw), {});
      assert.equal(res.status, 400, raw);
      assert.deepEqual((await res.json()).errors, ['body']);
    }
  });

  test('every response carries no-store', async () => {
    const { env } = emailEnv();
    const res = await handleContact(post(goodBody()), env);
    assert.match(res.headers.get('cache-control') ?? '', /no-store/i);
  });
});

describe('handleContact validation', () => {
  const cases = [
    ['bad topic', { topic: 'nope' }, 'topic'],
    ['missing name', { name: '' }, 'name'],
    ['overlong name', { name: 'x'.repeat(81) }, 'name'],
    ['bad email', { email: 'not-an-email' }, 'email'],
    ['overlong phone', { phone: '1'.repeat(41) }, 'phone'],
    ['neither email nor phone', { email: '', phone: '' }, 'contact'],
    ['overlong message', { message: 'x'.repeat(2001) }, 'message'],
    ['consent false', { consent: false }, 'consent'],
    ['consent missing', { consent: undefined }, 'consent'],
  ];
  for (const [label, over, field] of cases) {
    test(`invalid: ${label}`, async () => {
      const { env } = emailEnv();
      const res = await handleContact(post(goodBody(over)), env);
      assert.equal(res.status, 400, label);
      const json = await res.json();
      assert.equal(json.outcome, 'invalid');
      assert.ok(json.errors.includes(field), `${label} should name ${field}`);
    });
  }

  test('trims surrounding whitespace instead of rejecting', async () => {
    const { env, sent } = emailEnv();
    const res = await handleContact(post(goodBody({ name: '  Jan  ', email: '  jan@example.co.za  ' })), env);
    assert.equal((await res.json()).outcome, 'forwarded');
    assert.equal(sent.length, 1);
  });

  test('phone-only submissions pass with email empty', async () => {
    const { env, sent } = emailEnv();
    const res = await handleContact(post(goodBody({ email: '', phone: '0820000000' })), env);
    assert.equal((await res.json()).outcome, 'forwarded');
    assert.equal(sent.length, 1);
  });

  test('an invalid body answers invalid even where nothing is configured', async () => {
    const res = await handleContact(post(goodBody({ name: '' })), {});
    assert.equal((await res.json()).outcome, 'invalid');
  });
});

describe('handleContact Turnstile gate — C-21', () => {
  test('skipped entirely where no secret is set', async () => {
    const { env } = emailEnv();
    const res = await handleContact(post({ ...goodBody(), 'cf-turnstile-response': 'whatever' }), env);
    assert.equal((await res.json()).outcome, 'forwarded');
  });

  test('false where the secret is set but the token is missing', async () => {
    const { env } = emailEnv({ TURNSTILE_SECRET_KEY: 'sec' });
    const res = await handleContact(post(goodBody()), env);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.outcome, 'invalid');
    assert.ok(json.errors.includes('captcha'));
  });

  test('a valid token is delegated to siteverify and delivery proceeds', async () => {
    mockNet();
    const { env } = emailEnv({ TURNSTILE_SECRET_KEY: 'sec' });
    const res = await handleContact(post({ ...goodBody(), 'cf-turnstile-response': 'tok' }), env);
    assert.equal((await res.json()).outcome, 'forwarded');
  });
});

describe('handleContact delivery — C-31, C-34', () => {
  test('not-configured where neither channel exists', async () => {
    const res = await handleContact(post(goodBody()), {});
    assert.equal(res.status, 503);
    assert.equal((await res.json()).outcome, 'not-configured');
  });

  test('forwarded via email, consent unbound', async () => {
    const { env } = emailEnv();
    const res = await handleContact(post(goodBody()), env);
    const json = await res.json();
    assert.deepEqual([json.ok, json.outcome, json.via], [true, 'forwarded', 'email']);
    assert.equal(json.consentStored, undefined);
  });

  test('the prayer request mail includes the consent record', async () => {
    const store = r2();
    const { env, sent } = emailEnv({ CONSENT: store.bucket, CONTACT_EMAIL_TO: 'one@church.test,two@church.test' });
    const json = await (await handleContact(post(goodBody()), env)).json();
    assert.equal(json.consentStored, true);
    assert.equal(sent.length, 2);
    const record = JSON.parse(store.puts[0].body);
    assert.deepEqual(sent.map((call) => call.body.to[0].email), ['one@church.test', 'two@church.test']);
    assert.ok(sent.every((call) => call.body.to.length === 1));
    assert.match(sent[0].body.subject, /Gebedsversoek/);
    assert.match(sent[0].body.textContent, new RegExp(`Toestemmingsrekord: ${record.id}`));
    assert.match(sent[0].body.textContent, /Hallo/);
    assert.match(sent[0].body.textContent, /Struisbaai SDA Kerk/);
  });

  test('one recipient gets one notification', async () => {
    const { env, sent } = emailEnv();
    const json = await (await handleContact(post(goodBody()), env)).json();
    assert.equal(json.outcome, 'forwarded');
    assert.equal(sent.length, 1);
    assert.match(sent[0].body.textContent, /Gebedsversoek/);
  });

  test('the inbox copy lands in SUBMISSIONS with the full message — C-69', async () => {
    const store = r2();
    const { env } = emailEnv({ SUBMISSIONS: store.bucket });
    const json = await (await handleContact(post(goodBody()), env)).json();
    assert.equal(json.outcome, 'forwarded');
    assert.equal(store.puts.length, 1);
    assert.match(store.puts[0].key, /^submissions\/202\d\//);
    const submission = JSON.parse(store.puts[0].body);
    assert.equal(submission.message, 'Hallo');
    assert.deepEqual(submission.replies, []);
    assert.equal(submission.topic, 'connect');
  });

  test('a failed inbox put still delivers — storage never blocks — C-69', async () => {
    const { env, sent } = emailEnv({
      SUBMISSIONS: {
        async put() {
          throw new Error('r2 down');
        },
      },
    });
    const json = await (await handleContact(post(goodBody()), env)).json();
    assert.equal(json.outcome, 'forwarded');
    assert.equal(sent.length, 1);
  });

  test('a failed consent put still delivers — storage never blocks — C-34', async () => {    const { env, sent } = emailEnv({
      CONSENT: {
        async put() {
          throw new Error('r2 down');
        },
      },
    });
    const json = await (await handleContact(post(goodBody()), env)).json();
    assert.equal(json.outcome, 'forwarded');
    assert.equal(json.via, 'email');
    assert.equal(json.consentStored, false);
    assert.equal(sent.length, 1);
  });

  test('webhook fallback carries consent facts when email fails', async () => {
    mockNet({ brevoOk: false });
    const { env } = emailEnv({
      CONTACT_WEBHOOK_URL: 'https://hooks.test/inbox',
    });
    const json = await (await handleContact(post(goodBody()), env)).json();
    assert.equal(json.outcome, 'forwarded');
    assert.equal(json.via, 'webhook');
    assert.equal(webhookCalls.length, 1);
    const payload = JSON.parse(webhookCalls[0].body);
    assert.equal(payload.consent, true);
    assert.equal(payload.source, 'sda-struisbaai-website');
    assert.ok(payload.submittedAt);
    assert.ok(!('consentRecordId' in payload));
  });

  test('webhook payload points at the stored record where one exists', async () => {
    mockNet({ brevoOk: false });
    const store = r2();
    const { env } = emailEnv({
      CONTACT_WEBHOOK_URL: 'https://hooks.test/inbox',
      CONSENT: store.bucket,
    });
    const json = await (await handleContact(post(goodBody()), env)).json();
    assert.equal(json.via, 'webhook');
    const payload = JSON.parse(webhookCalls[0].body);
    assert.equal(payload.consentRecordId, JSON.parse(store.puts[0].body).id);
  });

  test('forward-error when every configured channel fails', async () => {
    mockNet({ webhookOk: false, brevoOk: false });
    const { env } = emailEnv({
      CONTACT_WEBHOOK_URL: 'https://hooks.test/inbox',
    });
    const res = await handleContact(post(goodBody()), env);
    assert.equal(res.status, 502);
    assert.equal((await res.json()).outcome, 'forward-error');
  });

  test('forward-error when email fails and no webhook exists', async () => {
    mockNet({ brevoOk: false });
    const { env } = emailEnv();
    assert.equal((await (await handleContact(post(goodBody()), env)).json()).outcome, 'forward-error');
  });

  test('webhook-only deploy delivers without Brevo configured', async () => {
    mockNet();
    const res = await handleContact(post(goodBody()), { CONTACT_WEBHOOK_URL: 'https://hooks.test/inbox' });
    const json = await res.json();
    assert.equal(json.outcome, 'forwarded');
    assert.equal(json.via, 'webhook');
  });
});
