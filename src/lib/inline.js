// Tiny inline formatter for component props: `code`, **bold** and [text](url), without a
// full Markdown renderer. Input is HTML-escaped first (quotes included, so a link URL
// can't break out of its attribute) and only http(s), mailto, site-relative and
// fragment URLs become links.
const SAFE_URL = /^(?:https?:\/\/|mailto:|\/|#|\.\.?\/)/i;

/** @param {string} text */
export function formatInline(text = '') {
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => (SAFE_URL.test(url) ? `<a href="${url}">${label}</a>` : m))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
