# Changelog

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
