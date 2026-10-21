// Added by the siteKit() integration (unless `mdLinks: false`). Runs at build time for
// every prerendered HTML page and fixes relative links to .md files; see lib/links.js.
import { rewriteMdLinks } from './lib/links.js';

/** @type {import('astro').MiddlewareHandler} */
export async function onRequest(_context, next) {
  const response = await next();
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('text/html')) return response;
  const html = await response.text();
  if (!/\.mdx?["#]/i.test(html)) return new Response(html, response);
  return new Response(rewriteMdLinks(html), response);
}
