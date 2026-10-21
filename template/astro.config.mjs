// @ts-check
import { defineConfig } from 'astro/config';
import siteKit from '@davidebisio/site-kit/integration';

export default defineConfig({
  site: 'https://davidebisio.github.io',
  // Project sites are served from /<repo>/. The hub (davidebisio.github.io) uses '/'.
  base: '{{base}}',
  integrations: [
    siteKit({
      title: '{{title}}',
      description: '{{description}}',
      repo: 'https://github.com/DavideBisio/{{repo}}',
      nav: [
        { label: 'Overview', href: '/' },
        { label: 'Docs', href: '/docs/' },
      ],
      // Opt-in, off by default: analytics: { goatcounter: 'davidebisio' },
    }),
  ],
});
