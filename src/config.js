// Site-wide configuration: defaults and validation. Plain JS so astro.config.mjs can
// import it from node_modules without a TypeScript loader.

/** @type {import('./config').Owner} */
export const DEFAULT_OWNER = {
  name: 'Davide Bisio',
  url: 'https://davidebisio.github.io/',
  links: [{ label: 'GitHub', url: 'https://github.com/davidebisio' }],
};

/**
 * Fill defaults and reject obvious mistakes early, at config time, with a clear message
 * instead of a broken page.
 * @param {import('./config').SiteKitConfig} input
 * @returns {import('./config').ResolvedSiteKitConfig}
 */
export function resolveConfig(input) {
  if (!input || typeof input !== 'object') throw new Error('site-kit: siteKit() needs a config object.');
  if (!input.title || typeof input.title !== 'string') throw new Error('site-kit: `title` is required.');

  const nav = input.nav ?? [];
  for (const item of nav) {
    if (!item?.label || !item?.href) throw new Error(`site-kit: every nav item needs label and href (got ${JSON.stringify(item)}).`);
  }
  if (input.repo && !/^https:\/\//.test(input.repo)) throw new Error('site-kit: `repo` must be an https URL.');

  const goatcounter = input.analytics?.goatcounter;
  if (goatcounter && !/^[a-z0-9-]+$/.test(goatcounter)) {
    throw new Error('site-kit: `analytics.goatcounter` is the site code (e.g. "davidebisio"), not a URL.');
  }

  return {
    title: input.title,
    description: input.description ?? '',
    hub: input.hub ?? false,
    owner: { ...DEFAULT_OWNER, ...input.owner, links: input.owner?.links ?? DEFAULT_OWNER.links },
    nav,
    repo: input.repo ?? null,
    logo: input.logo ?? null,
    favicon: input.favicon ?? null,
    themeColor: input.themeColor ?? '#1e232a',
    analytics: { goatcounter: goatcounter ?? null },
    lang: input.lang ?? 'en',
    mdLinks: input.mdLinks ?? true,
  };
}
