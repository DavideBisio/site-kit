#!/usr/bin/env node
// site-kit CLI. Run from the root of a project repo:
//
//   npx github:DavideBisio/site-kit init --title "Run Progress Lab"
//
// Adds an Astro site (default folder: site/), a Pages workflow calling the shared
// reusable workflow, and project.json for the hub. Never overwrites existing files
// unless --force is given; prints what it did and what to do next.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const KIT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = join(KIT_ROOT, 'template');
const KIT_VERSION = 'v' + JSON.parse(readFileSync(join(KIT_ROOT, 'package.json'), 'utf8')).version;
const OWNER = 'DavideBisio';

const HELP = `site-kit ${KIT_VERSION}

Usage: site-kit init [options]      (run from the repo root)

Options
  --title <name>         Project name shown in the header (default: from the repo name)
  --description <text>   One-line pitch (default: from package.json or a placeholder)
  --repo <name>          Repository name (default: git remote "origin", then folder name)
  --dir <path>           Where the Astro site goes (default: site; "." for the repo root)
  --app-build <cmd>      Command that builds an existing app, run from the repo root in CI
  --app-dist <path>      Folder that command outputs; copied to the site at /app/
  --python <version>     Install Python in CI before the app build (e.g. 3.12)
  --no-workflow          Don't write .github/workflows/pages.yml
  --force                Overwrite files that already exist
  --dry-run              Show what would be written, write nothing
  -h, --help             Show this help`;

function fail(message) {
  console.error(`site-kit: ${message}`);
  process.exit(1);
}

function repoFromGit(cwd) {
  try {
    const url = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    const m = url.match(/[/:]([^/:]+?)(?:\.git)?$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function titleCase(name) {
  return name.replace(/\.github\.io$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Escape for a single-quoted JS string and for YAML/Markdown contexts we template into. */
function jsString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
}

function listFiles(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path, base) : [relative(base, path)];
  });
}

function init(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      title: { type: 'string' },
      description: { type: 'string' },
      repo: { type: 'string' },
      dir: { type: 'string', default: 'site' },
      'app-build': { type: 'string' },
      'app-dist': { type: 'string' },
      python: { type: 'string' },
      'no-workflow': { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) return console.log(HELP);

  const root = process.cwd();
  if (!existsSync(join(root, '.git'))) fail('run this from the root of a git repository.');
  if (Boolean(values['app-build']) !== Boolean(values['app-dist'])) fail('--app-build and --app-dist go together.');

  const repo = values.repo ?? repoFromGit(root) ?? basename(root);
  if (!/^[\w.-]+$/.test(repo)) fail(`"${repo}" doesn't look like a repository name; pass --repo.`);
  const isHub = /\.github\.io$/i.test(repo);
  let pkgDescription;
  try {
    pkgDescription = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).description;
  } catch {}
  const title = values.title ?? titleCase(repo);
  const description = values.description ?? pkgDescription ?? `${title}: one-line description of the project.`;
  const siteDir = values.dir.replace(/^\.\/|\/+$/g, '') || '.';
  const siteRoot = resolve(root, siteDir);
  if (relative(root, siteRoot).startsWith('..')) fail('--dir must be inside the repository.');

  const vars = {
    title: jsString(title),
    description: jsString(description),
    repo,
    base: isHub ? '/' : `/${repo}`,
    siteDir,
    kitVersion: KIT_VERSION,
  };
  const fill = (text) => text.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in vars ? vars[key] : m));

  /** @type {{ path: string, content: string }[]} */
  const writes = [];

  for (const file of listFiles(TEMPLATE)) {
    const target = file === '_gitignore' ? '.gitignore' : file; // npm drops .gitignore from packages
    let content = fill(readFileSync(join(TEMPLATE, file), 'utf8'));
    if (file === 'package.json' && values['app-dist']) {
      const pkg = JSON.parse(content);
      const from = relative(siteRoot, resolve(root, values['app-dist'])).replace(/\\/g, '/') || '.';
      if (/['"`$\\]/.test(from)) fail('--app-dist must be a plain path (no quotes or $).');
      // Copy the app's build into public/app so `astro build` ships it at /app/.
      pkg.scripts['app:copy'] =
        `node -e "const f=require('fs');f.rmSync('public/app',{recursive:true,force:true});f.cpSync('${from}','public/app',{recursive:true})"`;
      content = JSON.stringify(pkg, null, 2) + '\n';
    }
    writes.push({ path: join(siteDir, target), content });
  }

  {
    const project = {
      name: title,
      tagline: description,
      repo: `${OWNER}/${repo}`,
      url: isHub ? `https://${repo.toLowerCase()}/` : `https://davidebisio.github.io/${repo}/`,
      status: 'experimental',
      tags: [],
      order: 100,
    };
    writes.push({ path: 'project.json', content: JSON.stringify(project, null, 2) + '\n' });
  }

  if (!values['no-workflow']) {
    const prebuild = values['app-build'] ? `${values['app-build']} && npm --prefix ${siteDir} run app:copy` : '';
    const lines = [
      '# Builds the site with the shared site-kit workflow and deploys it to GitHub Pages.',
      '# One-time setup: Settings → Pages → Source: GitHub Actions.',
      'name: Pages',
      '',
      'on:',
      '  push:',
      '    branches: [main]',
      '  workflow_dispatch:',
      '',
      'permissions:',
      '  contents: read',
      '  pages: write',
      '  id-token: write',
      '',
      'concurrency:',
      '  group: pages',
      '  cancel-in-progress: false',
      '',
      'jobs:',
      '  pages:',
      `    uses: ${OWNER}/site-kit/.github/workflows/deploy-pages.yml@${KIT_VERSION}`,
      '    with:',
      `      site-dir: ${JSON.stringify(siteDir)}`,
      ...(values.python ? [`      python-version: ${JSON.stringify(values.python)}`] : []),
      ...(prebuild ? [`      prebuild: ${JSON.stringify(prebuild)}`] : []),
      '',
    ];
    writes.push({ path: '.github/workflows/pages.yml', content: lines.join('\n') });
  }

  const skipped = [];
  const written = [];
  for (const { path, content } of writes) {
    const abs = join(root, path);
    if (existsSync(abs) && !values.force) {
      skipped.push(path);
      continue;
    }
    written.push(path);
    if (values['dry-run']) continue;
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }

  const verb = values['dry-run'] ? 'Would write' : 'Wrote';
  console.log(`${verb} ${written.length} file(s) for "${title}" (base ${vars.base}):`);
  for (const p of written) console.log(`  + ${p}`);
  if (skipped.length) {
    console.log(`Kept ${skipped.length} existing file(s) (use --force to overwrite):`);
    for (const p of skipped) console.log(`  = ${p}`);
  }
  const cd = siteDir === '.' ? '' : `cd ${siteDir} && `;
  console.log(`
Next:
  1. ${cd}npm install && npm run dev      (commit the generated package-lock.json)
  2. Edit src/pages/index.astro and the Markdown in src/content/docs/
  3. Settings → Pages → Source: GitHub Actions, then push to main`);
  if (values['app-dist']) console.log(`  The app build is copied to /app/; link it with withBase('/app/').`);
}

const [command, ...rest] = process.argv.slice(2);
if (!command || command === '-h' || command === '--help' || command === 'help') console.log(HELP);
else if (command === 'init') init(rest);
else if (command === '--version' || command === 'version') console.log(KIT_VERSION);
else fail(`unknown command "${command}". Try --help.`);
