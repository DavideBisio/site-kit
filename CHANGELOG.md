# Changelog

## v0.1.2 — 2026-10-21

Match the hub (davidebisio.github.io) more closely, and make long docs pages readable.

- Header: the logo sits inside the owner link, as on the hub; hub spacing (16px block
  padding, 12px logo gap, 24px between links); active link weight 500; the `/` separator
  uses `--sk-muted` so it stays visible on the lighter line color.
- Tokens: `--sk-line` is the hub's slate-200 (light) and teal (dark); `--sk-surface` is
  white in light; `--sk-muted` is the hub's slate-600 (light) and a teal lightened to AA
  (dark); `--sk-link` (light) is crimson darkened only as far as AA needs; body
  `--sk-leading` 1.5. New tokens `--sk-radius-md` and `--sk-btn-line`.
- Buttons: hub geometry (rounded-md, 8px/16px padding, 14px medium); the secondary
  button is outlined instead of filled.
- Links: no underline outside prose (underline on hover), as on the hub; prose links
  keep a faint underline. Footer links lose their underline.
- Main padding 2.5rem, as on the hub.
- `.sk-prose`: a rule above every `h2`, h1/h2/h3 at 2.25/1.5/1.125rem, more space
  between paragraphs and list items, quieter inline code (0.85em, wraps).
- `<site-bar>` fallbacks and spacing follow the same values.

## v0.1.1 — 2026-10-21

- Code blocks follow the site theme. Shiki previously rendered `github-dark` token colors
  on the light code background, so some tokens were unreadable in light mode. The
  integration now configures dual themes (`github-light-high-contrast` /
  `github-dark-default`, both AA on the new `--sk-pre-bg` token), unless the site sets its
  own Shiki theme.
- New token `--sk-pre-bg`; code blocks in `.sk-prose` get a hairline border.

## v0.1.0 — 2026-10-21

First release, extracted from davidebisio.github.io.

- Design tokens (`--sk-*`) from the personal site's palette, light/dark with
  `data-theme` and OS fallback, AA contrast; Tailwind 4 bridge; self-hosted Inter.
- `siteKit()` Astro integration with site-wide config.
- Components: `BaseLayout`, `DocsLayout`, `Head`, `Header`, `Footer`, `ThemeToggle`,
  `Hero`, `Section`, `FeatureGrid`, `Steps`, `Command`, `Callout`, `ProjectGrid`, and the
  article blocks `CardGrid`, `FlowSteps`, `TwoColumnCards`, `TreeDiagram`.
- Docs collection helpers (`docsCollection`, `docsNav`, `docTitle`, `editLink`) that can
  publish a repo's existing `docs/` folder, with relative `.md` links rewritten to pages.
- `project.json` registry (`parseProject`, `loadProjects`) for the hub's project list.
- `<site-bar>` web component for vanilla apps.
- Reusable `deploy-pages.yml` workflow and `site-kit init` scaffolder.
