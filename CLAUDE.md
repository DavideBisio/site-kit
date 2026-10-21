# site-kit

Shared design tokens, Astro components, a vanilla `<site-bar>`, a reusable Pages workflow
and the `site-kit init` scaffolder. Consumers install it as a git dependency pinned to a
tag; see README.md.

## Rules

- **Ship source, no build step.** Consumers compile `.astro` and CSS themselves.
- **Non-`.astro` modules are plain JS with a `.d.ts` beside them.** Node refuses to strip
  TypeScript inside `node_modules`, so a `.ts` file imported by `astro.config.mjs` breaks
  consumers.
- **No remote requests** from anything the kit ships (fonts are self-hosted; analytics are
  opt-in through config). `budget-planner` depends on this.
- **Every internal link goes through `withBase()`**; project sites live under `/<repo>/`.
- **All CSS in `@layer site-kit`** and colors only from `--sk-*` tokens. New text colors
  must reach 4.5:1 on `--sk-bg` and `--sk-surface` in both themes.
- **`site-bar.js` stays dependency-free**, runs as classic or module script, and uses a
  constructable stylesheet so it works under `style-src 'self'`.
- Theme storage key is `localStorage.theme` with values `light`/`dark`; keep it in sync
  between `ThemeScript.astro`, `ThemeToggle.astro` and `site-bar.js`.
- Template placeholders are `{{title}}`, `{{description}}`, `{{repo}}`, `{{base}}`,
  `{{siteDir}}`, `{{kitVersion}}`; they must leave the template buildable as is.

## Checks

- `npm test` for helpers in `src/lib` and `src/config.js` (pure modules only).
- `npm run check` before any release: scaffolds repos with `init`, builds them, asserts.
- Releasing: bump `version` in package.json (the template pins `v<version>`), add a
  CHANGELOG entry, tag `v<version>`.
