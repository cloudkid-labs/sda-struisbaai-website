import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHomePayload, scriptJson } from '../src/lib/cms/public.ts';
import { findElement, rewriteHome } from '../src/worker/cmsPublic.ts';
import { renderAboutSection, renderEventsSection, renderWeekSection } from '../src/worker/cmsRender.tsx';

test('homepage updates visible CMS sections when ThisWeek is hidden', () => {
  const built = buildHomePayload();
  const html = `<html><body>
<script type="application/json" id="cms-home">${scriptJson(built)}</script>
<main><section id="geleenthede"><p>Build events</p></section><section id="oor"><p>Build about</p></section></main>
</body></html>`;
  const eventPages = [{
    slug: 'summer-camp',
    title: { af: 'Somerkamp', en: 'Summer Camp' },
    eyebrow: { af: 'Kamp', en: 'Camp' },
    intro: { af: 'Somerprogram', en: 'Summer program' },
    blocks: [],
  }];

  const rewritten = rewriteHome(html, { events: [], heads: [], eventPages }, '2026-11-08', {
    week: renderWeekSection,
    events: renderEventsSection,
    about: renderAboutSection,
  });

  assert.ok(rewritten);
  assert.doesNotMatch(rewritten, /<section id="week"/);
  const payload = JSON.parse(/<script[^>]*id="cms-home"[^>]*>([\s\S]*?)<\/script>/.exec(rewritten)[1]);
  assert.deepEqual(payload.eventPages.map((page) => page.slug), ['summer-camp']);
  const range = findElement(rewritten, /<section id="geleenthede"/, 'section');
  assert.ok(range);
  assert.equal(rewritten.slice(...range), renderEventsSection(payload));
});
