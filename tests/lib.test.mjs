import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBase, isActive, isExternal } from '../src/lib/url.js';
import { formatInline } from '../src/lib/inline.js';
import { docTitle, docsNav, editLink } from '../src/lib/docs.js';
import { parseProject, loadProjects } from '../src/lib/projects.js';
import { resolveConfig } from '../src/config.js';

test('withBase prefixes site paths once and leaves external links alone', () => {
  assert.equal(withBase('/docs/', '/repo/'), '/repo/docs/');
  assert.equal(withBase('docs/', '/repo'), '/repo/docs/');
  assert.equal(withBase('/', '/repo/'), '/repo/');
  assert.equal(withBase('/repo/docs/', '/repo/'), '/repo/docs/');
  assert.equal(withBase('/docs/', '/'), '/docs/');
  for (const url of ['https://x.dev/a', '//cdn.x/a', 'mailto:a@b.c', '#top']) assert.equal(withBase(url, '/repo/'), url);
});

test('isActive: home only matches itself, sections match their children', () => {
  assert.equal(isActive('/repo/', '/repo/', '/repo/'), true);
  assert.equal(isActive('/repo/docs/', '/repo/', '/repo/'), false);
  assert.equal(isActive('/repo/docs/setup/', '/repo/docs/', '/repo/'), true);
  assert.equal(isActive('/repo/docs', '/repo/docs/', '/repo/'), true);
  assert.equal(isActive('/repo/', 'https://github.com/x', '/repo/'), false);
  assert.equal(isExternal('mailto:a@b.c'), false);
});

test('formatInline escapes HTML and only links safe URLs', () => {
  assert.equal(formatInline('a <b> & `c`'), 'a &lt;b&gt; &amp; <code>c</code>');
  assert.equal(formatInline('**bold** [x](/docs/)'), '<strong>bold</strong> <a href="/docs/">x</a>');
  assert.equal(formatInline('[x](javascript:alert(1))'), '[x](javascript:alert(1))');
  assert.ok(!formatInline('[x](/a" onclick="y)').includes('" onclick'));
});

test('docTitle falls back to the first heading, then the file name', () => {
  assert.equal(docTitle({ id: 'a', data: { title: 'Set' } }), 'Set');
  assert.equal(docTitle({ id: 'a', data: {}, body: 'intro\n# Grade-adjusted pace\n' }), 'Grade-adjusted pace');
  assert.equal(docTitle({ id: 'features/best-efforts', data: {}, body: '' }), 'Best efforts');
});

test('docsNav groups, sorts and drops drafts', () => {
  const e = (id, data) => ({ id, data: { order: 100, draft: false, ...data } });
  const nav = docsNav(
    [
      e('ref', { title: 'Reference', group: 'More', order: 1 }),
      e('b', { title: 'B' }),
      e('a', { title: 'A' }),
      e('start', { title: 'Start', order: 1 }),
      e('wip', { title: 'WIP', draft: true }),
    ],
    (x) => `/docs/${x.id}/`,
  );
  assert.deepEqual(
    nav.map((g) => [g.label, g.items.map((i) => i.title)]),
    [
      ['', ['Start', 'A', 'B']],
      ['More', ['Reference']],
    ],
  );
});

test('editLink resolves paths that climb out of the site folder', () => {
  const repo = 'https://github.com/DavideBisio/x';
  assert.equal(editLink(repo, 'src/content/docs/a.md'), `${repo}/edit/main/site/src/content/docs/a.md`);
  assert.equal(editLink(repo, '../docs/features/a.md'), `${repo}/edit/main/docs/features/a.md`);
  assert.equal(editLink(repo, 'src/a.md', { siteDir: '.' }), `${repo}/edit/main/src/a.md`);
  assert.equal(editLink(repo, undefined), undefined);
});

test('parseProject validates and normalizes', () => {
  const p = parseProject({ name: 'X', tagline: 'Y', repo: 'DavideBisio/x' });
  assert.equal(p.status, 'active');
  assert.equal(p.url, null);
  assert.throws(() => parseProject({ name: 'X', repo: 'x', status: 'done' }), /tagline.*owner\/name.*status/s);
});

test('loadProjects skips repos without a valid project.json', async () => {
  const fake = async (url) =>
    url.includes('/good/')
      ? { ok: true, json: async () => ({ name: 'Good', tagline: 't', repo: 'DavideBisio/good' }) }
      : { ok: false, status: 404 };
  const warnings = [];
  const projects = await loadProjects(['good', 'missing'], { fetch: fake, warn: (m) => warnings.push(m) });
  assert.deepEqual(projects.map((p) => p.name), ['Good']);
  assert.match(warnings[0], /DavideBisio\/missing: HTTP 404/);
});

test('resolveConfig fills defaults and rejects mistakes', () => {
  const c = resolveConfig({ title: 'T' });
  assert.equal(c.owner.name, 'Davide Bisio');
  assert.equal(c.analytics.goatcounter, null);
  assert.throws(() => resolveConfig({}), /title/);
  assert.throws(() => resolveConfig({ title: 'T', analytics: { goatcounter: 'https://x.goatcounter.com' } }), /site code/);
  assert.throws(() => resolveConfig({ title: 'T', nav: [{ label: 'x' }] }), /label and href/);
});

test('rewriteMdLinks turns relative .md links into page links', async () => {
  const { rewriteMdLinks } = await import('../src/lib/links.js');
  const a = (href) => `<a href="${href}">x</a>`;
  const r = (href) => rewriteMdLinks(a(href));
  assert.equal(r('runs-json-format.md'), a('../runs-json-format/'));
  assert.equal(r('features/grabber-download.md#setup'), a('../features/grabber-download/#setup'));
  assert.equal(r('../README.md'), a('../../readme/'));
  assert.equal(r('./My Page.mdx'), a('../my-page/'));
  assert.equal(r('guide/index.md'), a('../guide/'));
  for (const keep of ['https://x.dev/a.md', '/docs/a.md', '#a.md', 'notes.mdown', 'a.md.txt']) assert.equal(r(keep), a(keep));
  assert.equal(rewriteMdLinks('<code>see a.md</code>'), '<code>see a.md</code>');
  assert.equal(rewriteMdLinks('<a class="x" href="a.md" data-y>'), '<a class="x" href="../a/" data-y>');
});
