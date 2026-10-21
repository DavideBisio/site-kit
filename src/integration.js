// Astro integration: exposes the resolved config to the kit's components through the
// virtual module "virtual:site-kit/config" and makes sure Vite compiles the package.
import { resolveConfig } from './config.js';

const VIRTUAL_ID = 'virtual:site-kit/config';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const PACKAGE = '@davidebisio/site-kit';
// Every token color in these two reaches 4.5:1 on --sk-pre-bg in its theme.
const SHIKI_THEMES = { light: 'github-light-high-contrast', dark: 'github-dark-default' };

/**
 * @param {import('./config').SiteKitConfig} userConfig
 * @returns {import('astro').AstroIntegration}
 */
export default function siteKit(userConfig) {
  const config = resolveConfig(userConfig);

  return {
    name: PACKAGE,
    hooks: {
      'astro:config:setup': ({ config: astroConfig, updateConfig, addMiddleware }) => {
        if (config.mdLinks) {
          // Fix relative links to .md files in rendered pages (docs reused from a repo).
          addMiddleware({ entrypoint: new URL('./middleware.js', import.meta.url), order: 'post' });
        }
        // Code blocks follow the site theme: Shiki writes both palettes as CSS variables
        // (no inline colors) and base.css picks one per data-theme. Skipped when the site
        // configures its own Shiki theme.
        const shiki = astroConfig.markdown?.shikiConfig;
        if (!shiki || (shiki.theme === 'github-dark' && !Object.keys(shiki.themes ?? {}).length)) {
          updateConfig({ markdown: { shikiConfig: { themes: SHIKI_THEMES, defaultColor: false } } });
        }
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'site-kit:config',
                resolveId(id) {
                  return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
                },
                load(id) {
                  return id === RESOLVED_ID ? `export default ${JSON.stringify(config)};` : undefined;
                },
              },
            ],
            // The package ships source (.astro, CSS); never let SSR load it as an external.
            ssr: { noExternal: [PACKAGE] },
          },
        });
      },
      'astro:config:done': ({ injectTypes }) => {
        injectTypes({
          filename: 'site-kit.d.ts',
          content: `declare module '${VIRTUAL_ID}' {\n  const config: import('${PACKAGE}/integration').ResolvedSiteKitConfig;\n  export default config;\n}\n`,
        });
      },
    },
  };
}
