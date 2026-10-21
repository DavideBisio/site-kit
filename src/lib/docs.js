// Pure helpers for docs pages (no Astro imports, so they run and test in plain Node).

/**
 * Markdown files reused from a repo's docs/ often have no frontmatter. Use the first
 * "# Heading" as the title, then the file name.
 * @param {{ id: string, data: { title?: string }, body?: string }} entry
 */
export function docTitle(entry) {
  if (entry.data.title) return entry.data.title;
  const h1 = entry.body?.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  const name = entry.id.split('/').pop() || entry.id;
  return name.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Build the docs sidebar: drafts removed, groups in first-seen order of their lowest
 * `order`, pages sorted by order then title.
 * @param {Array<{ id: string, data: any, body?: string }>} entries
 * @param {(entry: any) => string} href  maps an entry to its page URL
 */
export function docsNav(entries, href) {
  const pages = entries
    .filter((e) => !e.data.draft)
    .map((e) => ({ id: e.id, title: docTitle(e), href: href(e), group: e.data.group ?? '', order: e.data.order ?? 100 }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  const groups = new Map();
  for (const page of pages) {
    if (!groups.has(page.group)) groups.set(page.group, []);
    groups.get(page.group).push(page);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : 0))
    .map(([label, items]) => ({ label, items }));
}

/**
 * "Edit on GitHub" URL for a docs entry. `filePath` is relative to the site folder and
 * may climb out of it (docs reused from ../docs), so the path is resolved first.
 * @param {string} repo      https://github.com/owner/name
 * @param {string | undefined} filePath  entry.filePath
 * @param {{ siteDir?: string, branch?: string }} [options]
 */
export function editLink(repo, filePath, { siteDir = 'site', branch = 'main' } = {}) {
  if (!filePath) return undefined;
  const parts = [];
  for (const seg of `${siteDir}/${filePath}`.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return `${repo.replace(/\/+$/, '')}/edit/${branch}/${parts.join('/')}`;
}
