import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import { requestFormCopy, requestTopics } from '../src/data/requestCopy.ts';

describe('prayer request page copy', () => {
  test('connect is presented as a prayer request in both locales', () => {
    assert.match(requestTopics.connect.af.heading, /bid/);
    assert.match(requestTopics.connect.af.submit, /gebedsversoek/i);
    assert.match(requestTopics.connect.en.heading, /pray/i);
    assert.equal(requestTopics.connect.en.submit, 'Send prayer request');
    assert.ok(!JSON.stringify(requestTopics.connect).includes('Tygerberg'));
  });

  test('the shared privacy copy names Brevo as the email processor', () => {
    assert.match(requestFormCopy.af.privacyBody, /Brevo/);
    assert.match(requestFormCopy.en.privacyBody, /Brevo/);
    assert.ok(!requestFormCopy.af.privacyBody.includes('Tygerberg'));
    assert.ok(!requestFormCopy.en.privacyBody.includes('Tygerberg'));
  });
});
