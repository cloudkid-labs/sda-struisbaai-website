import { strict as assert } from 'node:assert';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { test, describe } from 'node:test';
import { SOCIAL_LINKS } from '../src/data/site.ts';

const { Footer } = await import('../src/components/react/Footer.tsx');
const { RequestPage } = await import('../src/components/react/RequestPage.tsx');
const { LanguageProvider } = await import('../src/context/LanguageContext.tsx');

const LEGACY_URLS = [
  'https://www.youtube.com/@SDATygerberg/streams',
  'https://www.instagram.com/sdatygerberg',
  'https://www.facebook.com/SDATygerbergStream',
];

describe('social links', () => {
  test('unconfirmed Struisbaai accounts are not configured', () => {
    assert.deepEqual(SOCIAL_LINKS, []);
  });

  test('footer and connect page do not render the old church accounts', () => {
    const footer = renderToString(createElement(LanguageProvider, null, createElement(Footer)));
    const connect = renderToString(createElement(RequestPage, { topic: 'connect' }));
    for (const url of LEGACY_URLS) {
      assert.equal(footer.includes(url), false);
      assert.equal(connect.includes(url), false);
    }
    assert.doesNotMatch(footer, />Volg ons<\/);
  });
});
