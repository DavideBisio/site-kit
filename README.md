# site-kit

Shared look and plumbing for Davide Bisio's project sites on GitHub Pages: one design
system, one set of Astro components, one deploy workflow and a scaffolding command, so
every `davidebisio.github.io/<repo>/` site looks and behaves the same.

| Piece | What it is | Used by |
| --- | --- | --- |
| `src/styles/tokens.css` | `--sk-*` CSS custom properties: brand palette, light/dark, type, spacing | everything, including vanilla apps |
| `src/styles/tailwind.css` | Maps the tokens into Tailwind 4 (`bg-surface`, `text-muted`, …) | Tailwind sites (the personal site) |
| `siteKit()` integration | Site-wide config (title, nav, repo, owner, analytics) for the components | Astro sites |
| Components | Layouts, header/footer, landing sections, docs, article blocks | Astro sites |
| `<site-bar>` | The shared top bar and theme switch as a dependency-free web component | apps not built with Astro |
| `deploy-pages.yml` | Reusable workflow: build the site (and an embedded app), deploy to Pages | every repo |
| `site-kit init` | Adds a site, the Pages workflow and `project.json` to an existing repo | new and existing repos |

Design rules the kit keeps:

- **No third-party requests by default.** Inter is self-hosted; analytics are opt-in.
  `budget-planner` forbids remote assets, and every project inherits that safely.
- **Apps stay apps.** The Astro site is the landing page and docs. An existing app keeps
  its own build (single-file, offline, Python-bundled…) and is copied to `/app/`.
- **One theme everywhere.** The light/dark choice is stored in `localStorage.theme`, which
  all `*.github.io` project sites share, so switching on one carries to the rest.
- **Base paths are handled.** Project sites live under `/<repo>/`; every kit link goes
  through `withBase()`.

## Start a site in a repo

From the repo root:

```bash
npx github:DavideBisio/site-kit#v0.1.0 init --title "My Project"
cd site && npm install && npm run dev
```

That writes:

```
site/                         Astro site (landing page + docs)
  astro.config.mjs            base '/<repo>', siteKit({ title, repo, nav })
  src/pages/index.astro       Hero, feature grid, quick start
  src/pages/docs/…            docs index + one page per Markdown file
  src/content/docs/*.md       two sample pages
.github/workflows/pages.yml   calls the shared deploy workflow
project.json                  how the personal site lists this project
```

Then set **Settings → Pages → Source: GitHub Actions** and push to `main`.

`init` options: `--dir` (default `site`, `.` for the repo root), `--description`,
`--repo`, `--app-build <cmd>` + `--app-dist <dir>` to embed an existing app at `/app/`,
`--python <version>` if that build needs Python, `--no-workflow`, `--force`, `--dry-run`.
It never overwrites a file unless `--force` is given.

## Adopting it in the existing repos

### claude-code-workflow (no page yet)

```bash
npx github:DavideBisio/site-kit#v0.1.0 init --title "Claude Code Workflow"
```

To publish the docs that already exist instead of copying them, point the collection at
them in `site/src/content.config.ts`:

```ts
docs: docsCollection({ base: '../workflow', pattern: ['README.md', 'skills/*/SKILL.md'] }),
```

Pages without a `title` take it from their first `# heading`, and relative links between
Markdown files (`[setup](features/setup.md#install)`) are rewritten to the built pages, so
docs written for GitHub work on the site unchanged. Links from docs to non-Markdown files
elsewhere in the repo (`../src/app.py`) should be absolute GitHub URLs. Turn the rewriting
off with `siteKit({ mdLinks: false })`.

### garmin-run-progress (Python-bundled single-file app)

```bash
npx github:DavideBisio/site-kit#v0.1.0 init --title "Run Progress Lab" \
  --python 3.12 --app-build "python tools/build.py" --app-dist dist
```

- Docs: `docsCollection({ base: '../docs' })` publishes `docs/` and `docs/features/` as is.
- Shared bar in the app: copy `src/elements/site-bar.js` to `src/page/js/site-bar.js` and add
  `<script src="js/site-bar.js"></script>` with the other scripts; `tools/build.py` inlines
  it like the rest. Then put `<site-bar project="Run Progress Lab" home="../" repo="…" wide>`
  at the top of `<body>`. The app already understands `data-theme`, so the switch works.
- Remove the Pages deploy job from `ci.yml` (keep the tests); `pages.yml` deploys now.
- The app moves from `/garmin-run-progress/` to `/garmin-run-progress/app/`. Update the
  README links, or keep the app at the root by building the site with `base` set to
  `/garmin-run-progress/about` instead — the kit doesn't mind either way.

### budget-planner (Vite, offline, privacy-first)

```bash
npx github:DavideBisio/site-kit#v0.1.0 init --title "Budget Planner" \
  --app-build "npm ci && npm run build" --app-dist dist
```

- The app's `base: './'` build works unchanged at `/app/`.
- Add `<site-bar … no-theme>` and load `site-bar.js` as a local module: it makes no
  requests and works under the planned `connect-src 'none'` CSP. `no-theme` hides the switch
  because the app follows the OS setting only.
- Optional: import `tokens.css` and alias the app's own tokens to `--sk-*` to share colors.

### davidebisio.github.io (the hub)

The personal site becomes a consumer of the kit it was extracted from:

1. `npm i github:DavideBisio/site-kit#v0.1.0`
2. `astro.config.mjs`: add `siteKit({ title: 'Davide Bisio', hub: true, logo: '/logo.jpg', nav: […], analytics: { goatcounter: 'davidebisio' } })`.
3. `global.css`: replace the slate/sky remapping with
   ```css
   @import '@davidebisio/site-kit/styles/index.css';
   @import 'tailwindcss';
   @import '@davidebisio/site-kit/styles/tailwind.css';
   ```
   and move pages from `dark:` pairs to the semantic utilities as they are touched.
4. `Layout.astro` wraps `BaseLayout`; `Header`/`Footer` and the article components are
   replaced by the kit's (same props).
5. A projects page lists every project from its `project.json`:
   ```astro
   ---
   import { ProjectGrid } from '@davidebisio/site-kit';
   import { loadProjects } from '@davidebisio/site-kit/projects';
   const projects = await loadProjects(['garmin-run-progress', 'budget-planner', 'claude-code-workflow']);
   ---
   <ProjectGrid projects={projects} />
   ```

## Using the pieces

### Config (`astro.config.mjs`)

```js
siteKit({
  title: 'Run Progress Lab',          // header + page titles (required)
  description: 'One-line pitch',      // default meta description
  repo: 'https://github.com/DavideBisio/garmin-run-progress', // "Source" links
  nav: [{ label: 'Docs', href: '/docs/' }, { label: 'App', href: '/app/' }], // base added for you
  hub: false,                         // true only for the personal site
  logo: '/logo.jpg', favicon: '/favicon.svg', // optional, site-relative
  analytics: { goatcounter: 'davidebisio' },  // optional, off by default
  mdLinks: true,                      // rewrite relative .md links to page links
  owner: { name, url, links },        // defaults to Davide Bisio / davidebisio.github.io
})
```

Pages can read the resolved config: `import config from 'virtual:site-kit/config'`.

### Components

`import { … } from '@davidebisio/site-kit'`

| Component | Props |
| --- | --- |
| `BaseLayout` | `title`, `description`, `wide`, `bare`, `type`, `image`, `noindex`, `structuredData`; slots `head`, `footer` |
| `DocsLayout` | `title`, `nav` (from `docsNav`), `headings`, `editUrl`, `showTitle` |
| `Hero` | `title`, `lede`, `eyebrow`, `status`, `actions[]`; slot `media` |
| `Section` | `title`, `intro`, `id` |
| `FeatureGrid` | `items[{ title, body, icon, href }]`, `min` |
| `Steps` | `items[{ title, body, command }]` |
| `Command` | `code`, `prompt` |
| `Callout` | `tone` (`note`, `tip`, `warning`, `privacy`), `title` |
| `ProjectGrid` | `projects` (from `loadProjects`) |
| `CardGrid`, `FlowSteps`, `TwoColumnCards`, `TreeDiagram` | as on the personal site |
| `Head`, `Header`, `Footer`, `ThemeToggle`, `ThemeScript` | building blocks of `BaseLayout` |

Text props accept `` `code` ``, `**bold**` and `[links](/path/)`. Helpers: `withBase`,
`isActive`, `formatInline`; from `/content`: `docsCollection`, `docsNav`, `docTitle`,
`editLink`; from `/projects`: `loadProjects`, `parseProject`.

All kit CSS sits in `@layer site-kit`, so a site's own unlayered CSS and every Tailwind
layer override it without `!important`.

### Tokens

Semantic: `--sk-bg`, `--sk-surface`, `--sk-surface-2`, `--sk-ink`, `--sk-muted`,
`--sk-line`, `--sk-accent` (fills) / `--sk-accent-ink`, `--sk-link`, `--sk-highlight`,
`--sk-secondary`, `--sk-code-bg` (inline code), `--sk-pre-bg` (code blocks), `--sk-good`,
`--sk-bad`, `--sk-focus`. Brand:
`--sk-slate`, `--sk-crimson`, `--sk-amber`, `--sk-offwhite`, `--sk-teal`. Plus type
(`--sk-font-sans`, `--sk-text-*`), spacing (`--sk-space-1…8`), layout
(`--sk-width-narrow`, `--sk-width-wide`) and shape (`--sk-radius`, `--sk-shadow`).
Text colors meet WCAG AA (4.5:1) on both backgrounds in both themes.

Markdown code blocks follow the site theme: the integration sets Shiki to
`github-light-high-contrast` / `github-dark-default` with `defaultColor: false`, and
`base.css` picks the palette per `data-theme`. Every token color in those themes reaches
4.5:1 on `--sk-pre-bg`. A site that sets its own `markdown.shikiConfig` theme keeps it.

### `<site-bar>` for vanilla apps

```html
<link rel="stylesheet" href="tokens.css" />  <!-- optional: without it the bar uses built-in fallbacks -->
<script src="site-bar.js"></script>
<site-bar project="Budget Planner" home="../" repo="https://github.com/DavideBisio/budget-planner" no-theme>
  <a slot="links" href="../docs/">Docs</a>
</site-bar>
```

Attributes: `project`, `home`, `owner`, `owner-href`, `repo`, `no-theme`, `wide`. Works as
a classic or module script, inlined or not, under a strict CSP.

### Deploy workflow

```yaml
jobs:
  pages:
    uses: DavideBisio/site-kit/.github/workflows/deploy-pages.yml@v0.1.0
    with:
      site-dir: site            # default
      python-version: '3.12'    # optional
      prebuild: python tools/build.py && npm --prefix site run app:copy   # optional
```

The caller needs `permissions: { contents: read, pages: write, id-token: write }`
(`init` writes them).

## Versioning

Sites pin a tag (`#v0.1.0` in `package.json`, `@v0.1.0` in the workflow). To upgrade,
change both and rebuild. Breaking changes bump the minor version while the kit is 0.x and
are listed in [CHANGELOG.md](CHANGELOG.md).

## Developing the kit

```bash
npm test         # unit tests for the helpers (no install needed)
npm run check    # scaffolds two throwaway repos with `init` and builds them with Astro
```

`npm run check` installs this checkout into the scaffolded sites the way a git
dependency would and asserts on the built HTML (base paths, docs, embedded app, no
third-party requests). CI runs both on every push.

## License

GPL-3.0, see [LICENSE](LICENSE).
