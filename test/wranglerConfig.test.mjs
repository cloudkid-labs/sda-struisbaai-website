import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import { readFileSync } from 'node:fs';

const text = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
const config = JSON.parse(
  text
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n'),
);

describe('Struisbaai deployment isolation', () => {
  test('the default Worker has no production route or Tygerberg data bindings', () => {
    assert.equal(config.name, 'struisbaai-sda-website');
    assert.ok(!('routes' in config));
    assert.ok(!('send_email' in config));
    assert.ok(!('r2_buckets' in config));
    assert.equal(config.vars.BOARD_MAIL, 'off');
  });

  test('devtest uses Struisbaai hostname and no mail or R2 bindings', () => {
    const devtest = config.env.devtest;
    assert.equal(devtest.name, 'struisbaai-sda-website-devtest');
    assert.ok(devtest.routes.some((r) => r.pattern === 'struisbaai-sda.cloudkid.link' && r.custom_domain));
    assert.ok(!('send_email' in devtest));
    assert.ok(!('r2_buckets' in devtest));
    assert.equal(devtest.vars.BOARD_MAIL, 'off');
    assert.equal(devtest.vars.BOARD_ALLOWED_EMAILS, '');
  });

  test('the Worker owns every path and leaves fallback headshots on static assets', () => {
    assert.equal(config.assets.run_worker_first[0], '/*');
    assert.ok(config.assets.run_worker_first.includes('!/images/hod/fallback/*'));
  });

  test('both Workers define BASE_URL for the React render', () => {
    for (const block of [config, config.env.devtest]) {
      assert.deepEqual(JSON.parse(block.define['import.meta.env']), { BASE_URL: '/' });
    }
  });
});
