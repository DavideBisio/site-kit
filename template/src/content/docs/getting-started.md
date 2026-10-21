---
title: Getting started
description: Install and run {{title}} for the first time.
order: 1
---

Replace this page with real setup steps. Every Markdown file in `src/content/docs/`
becomes a page under `/docs/`, listed in the sidebar.

## Frontmatter

| Field         | Purpose                                         |
| ------------- | ----------------------------------------------- |
| `title`       | Page title (falls back to the first `# heading`) |
| `description` | Shown on the docs index and in search results   |
| `group`       | Sidebar group heading                           |
| `order`       | Sort order inside the group, lower first        |
| `draft`       | `true` hides the page                           |

## Components in Markdown

Rename a page to `.mdx` (after adding `@astrojs/mdx`) to use kit components such as
`<Callout>` or `<FlowSteps>` inside it.
