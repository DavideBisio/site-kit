// Base-path-aware links. Project sites live under /<repo>/ on davidebisio.github.io, so
// every internal href must carry Astro's `base`. Components call these; sites can too.

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

/** Astro's base path, always with a trailing slash ("/" or "/repo/"). */
export function basePath() {
  const raw = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  return raw.endsWith('/') ? raw : raw + '/';
}

/**
 * Prefix a site-relative path with the base. Absolute URLs, protocol links (mailto:,
 * https:), protocol-relative URLs and fragments pass through untouched.
 * @param {string} path
 * @param {string} [base]
 */
export function withBase(path, base = basePath()) {
  if (!path) return base;
  if (EXTERNAL.test(path)) return path;
  const b = base.endsWith('/') ? base : base + '/';
  if (path === b || (b !== '/' && path.startsWith(b))) return path;
  return b + path.replace(/^\/+/, '');
}

/** True for links that leave the site. */
export function isExternal(href) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href) && !/^(?:mailto|tel):/i.test(href);
}

/**
 * Is the nav item for `href` the current page (or its section)? The base root only
 * matches itself, so "Home" isn't active everywhere.
 * @param {string} currentPath  Astro.url.pathname
 * @param {string} href         already base-prefixed
 * @param {string} [base]
 */
export function isActive(currentPath, href, base = basePath()) {
  if (isExternal(href)) return false;
  const norm = (p) => (p.endsWith('/') ? p : p + '/');
  const cur = norm(currentPath);
  const target = norm(href);
  return target === norm(base) ? cur === target : cur.startsWith(target);
}
