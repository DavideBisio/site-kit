#!/usr/bin/env node
// End-to-end check: scaffold throwaway repos with `site-kit init`, install this checkout
// of the kit into them (copied, as a git dependency would be) and run `astro build`.
// Then assert on the output: pages exist, links carry the base path, no placeholders
// leak, and an embedded app lands at /app/. Used by CI and before tagging a release.
//
//   npm run check            keep output in a temp dir and print its path
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(KIT, 'scripts', 'cli.mjs');
const work = mkdtempSync(join(process.env.SITE_KIT_TMP ?? tmpdir(), 'site-kit-check-'));
let failures = 0;

function run(cmd, args, cwd) {
  execFileSync(cmd, args, { cwd, stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
}
function check(ok, message) {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${message}`);
  if (!ok) failures++;
}
function read(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function scaffold(name, initArgs, prepare) {
  console.log(`\n== ${name}`);
  const repo = join(work, name);
  mkdirSync(repo, { recursive: true });
  run('git', ['init', '-q'], repo);
  prepare?.(repo);
  run(process.execPath, [CLI, 'init', '--repo', name, ...initArgs], repo);
  return repo;
}

function build(siteRoot) {
  // Swap the git dependency for this checkout. --install-links copies it like a real
  // install would, so the kit resolves astro from the site, not from the kit's own
  // node_modules.
  const pkgPath = join(siteRoot, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.dependencies['@davidebisio/site-kit'] = `file:${KIT}`;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  run('npm', ['install', '--install-links', '--no-audit', '--no-fund', '--loglevel=error'], siteRoot);
  if (pkg.scripts['app:copy']) run('npm', ['run', '--silent', 'app:copy'], siteRoot);
  run('npm', ['run', 'build', '--silent'], siteRoot);
  return join(siteRoot, 'dist');
}

// 1. A project site in site/ with an embedded app, like garmin-run-progress.
{
  const repo = scaffold('demo-project', ['--title', "Demo's Project", '--app-build', 'true', '--app-dist', 'app-dist', '--python', '3.12'], (r) => {
    mkdirSync(join(r, 'app-dist'));
    writeFileSync(join(r, 'app-dist', 'index.html'), '<!doctype html><title>app</title><site-bar project="Demo"></site-bar>');
  });
  const dist = build(join(repo, 'site'));
  const home = read(join(dist, 'index.html'));
  const doc = read(join(dist, 'docs', 'getting-started', 'index.html'));
  const ref = read(join(dist, 'docs', 'configuration', 'index.html'));
  check(home.includes("<title>Demo&#39;s Project</title>") || home.includes("<title>Demo's Project</title>"), 'home title, apostrophe survives templating');
  check(home.includes('href="/demo-project/docs/getting-started/"'), 'hero link carries the base path');
  check(home.includes('href="/demo-project/docs/"') && home.includes('aria-current="page"'), 'nav links carry base; current page marked');
  check(home.includes('https://davidebisio.github.io/') && home.includes('Davide Bisio'), 'owner link to hub in header');
  check(!home.includes('goatcounter'), 'no analytics unless opted in');
  check(!/\{\{\w+\}\}/.test(home + doc + ref), 'no template placeholders left');
  check(/<h1[^>]*>Getting started<\/h1>/.test(doc) && doc.includes('Configuration'), 'docs page renders with sidebar');
  check(doc.includes('/edit/main/site/src/content/docs/getting-started.md'), 'edit link points at the source file');
  check(ref.includes('Reference') && ref.includes('Previous'), 'sidebar group and pager');
  const pre = doc.match(/<pre class="astro-code[\s\S]*?<\/pre>/)?.[0] ?? '';
  check(pre.includes('--shiki-dark:') && !/[;"]color:#/.test(pre), 'code blocks carry both palettes, no inline colors');
  check(existsSync(join(dist, 'docs', 'index.html')) && existsSync(join(dist, '404.html')), 'docs index and 404 exist');
  check(read(join(dist, 'app', 'index.html')).includes('<site-bar'), 'app copied to /app/');
  const workflow = read(join(repo, '.github', 'workflows', 'pages.yml'));
  check(workflow.includes('deploy-pages.yml@v') && workflow.includes('python-version: "3.12"') && workflow.includes('npm --prefix site run app:copy'), 'workflow calls the shared workflow with app prebuild');
  const project = JSON.parse(read(join(repo, 'project.json')) || '{}');
  check(project.repo === 'DavideBisio/demo-project' && project.url === 'https://davidebisio.github.io/demo-project/', 'project.json filled');
  const css = execFileSync('sh', ['-c', `cat ${join(dist, '_astro')}/*.css`]).toString();
  check(css.includes('--sk-bg') && css.includes('@layer site-kit'), 'tokens bundled in the site-kit layer');
  check(!/fonts\.googleapis|gc\.zgo\.at/.test(css + home), 'no third-party requests');
}

// 2. A hub-style site at the repo root (base "/"), like davidebisio.github.io.
{
  const repo = scaffold('someone.github.io', ['--dir', '.', '--no-workflow']);
  const dist = build(repo);
  const home = read(join(dist, 'index.html'));
  check(home.includes('href="/docs/getting-started/"'), 'root base: links have no prefix');
  check(!existsSync(join(repo, '.github', 'workflows', 'pages.yml')), '--no-workflow respected');
}

// 3. Docs reused from the repo's docs/ folder, linking file to file like on GitHub.
{
  const repo = scaffold('docs-reuse', ['--no-workflow'], (r) => {
    mkdirSync(join(r, 'docs', 'features'), { recursive: true });
    writeFileSync(join(r, 'docs', 'README.md'), '# Docs home\n\nSee [the grabber](features/grabber-download.md#setup) and [format](runs-json-format.md).\n');
    writeFileSync(join(r, 'docs', 'runs-json-format.md'), '# runs.json format\n\nBack to [home](README.md).\n');
    writeFileSync(join(r, 'docs', 'features', 'grabber-download.md'), '# Grabber download\n\n## Setup\n\nUses [the format](../runs-json-format.md).\n');
  });
  writeFileSync(
    join(repo, 'site', 'src', 'content.config.ts'),
    "import { docsCollection } from '@davidebisio/site-kit/content';\nexport const collections = { docs: docsCollection({ base: '../docs' }) };\n",
  );
  const dist = build(join(repo, 'site'));
  const pages = ['readme', 'runs-json-format', 'features/grabber-download'];
  check(pages.every((p) => existsSync(join(dist, 'docs', p, 'index.html'))), 'pages built from ../docs');
  let links = 0;
  let broken = [];
  for (const p of pages) {
    const html = read(join(dist, 'docs', p, 'index.html'));
    if (/href="(?![a-z]+:)[^"]*\.md[#"]/.test(html)) broken.push(`${p}: .md link left`);
    for (const [, href] of html.matchAll(/<a href="(\.\.\/[^"#]*)/g)) {
      links++;
      const target = resolve(join(dist, 'docs', p), href, 'index.html');
      if (!existsSync(target)) broken.push(`${p} -> ${href}`);
    }
  }
  check(links >= 4 && broken.length === 0, `relative .md links rewritten and resolve (${links} links${broken.length ? '; broken: ' + broken.join(', ') : ''})`);
  check(/<title>Grabber download/.test(read(join(dist, 'docs', 'features', 'grabber-download', 'index.html'))), 'title taken from the first heading');
}

// 4. Re-running init keeps existing files.
{
  const out = execFileSync(process.execPath, [CLI, 'init', '--repo', 'demo-project'], { cwd: join(work, 'demo-project') }).toString();
  check(/Wrote 0 file/.test(out) && out.includes('= project.json'), 'second init overwrites nothing');
}

console.log(`\n${failures ? `${failures} check(s) failed` : 'All checks passed'}. Output: ${work}`);
process.exit(failures ? 1 : 0);
