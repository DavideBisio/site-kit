// Rewrite relative links to Markdown files ("setup.md", "../features/gap.md#how") into
// links to their built pages. Markdown reused from a repo's docs/ links file to file,
// which works on GitHub but 404s on the site.
//
// A page built from dir/name.md is served at dir/name/, one level deeper than the file,
// so a link relative to the file gains one "../". Ids follow Astro's glob loader:
// lowercase, spaces as dashes. Absolute, protocol and fragment-only links are untouched,
// as are links inside <code>/<pre> (they are text there, not hrefs).

const MD_HREF = /(<a\b[^>]*?\shref=")([^"]+?)\.mdx?((?:#[^"]*)?)"/gi;

/** Same rule as github-slugger, which Astro's glob loader applies to each path segment. */
function slug(segment) {
  return segment
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

/** @param {string} href  the part before ".md" */
function toPageHref(href) {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(href)) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(href);
  } catch {
    decoded = href;
  }
  const segments = decoded
    .split('/')
    .filter((s) => s !== '.' && s !== '')
    .map((s) => (s === '..' ? s : slug(s)));
  // dir/index.md is served at dir/ (the loader drops a trailing "/index").
  if (segments.length && segments[segments.length - 1] === 'index') segments.pop();
  const path = segments.join('/');
  return `../${path}${path ? '/' : ''}`;
}

/** @param {string} html */
export function rewriteMdLinks(html) {
  return html.replace(MD_HREF, (match, start, href, hash) => {
    const page = toPageHref(href);
    return page === null ? match : `${start}${page}${hash}"`;
  });
}
