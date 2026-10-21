// One import for the common pieces:
//   import { BaseLayout, Hero, Section, FeatureGrid } from '@davidebisio/site-kit';
// Deep imports work too: '@davidebisio/site-kit/components/Hero.astro'.
export { default as BaseLayout } from './components/BaseLayout.astro';
export { default as DocsLayout } from './components/DocsLayout.astro';
export { default as Head } from './components/Head.astro';
export { default as Header } from './components/Header.astro';
export { default as Footer } from './components/Footer.astro';
export { default as ThemeToggle } from './components/ThemeToggle.astro';
export { default as ThemeScript } from './components/ThemeScript.astro';
export { default as Hero } from './components/Hero.astro';
export { default as Section } from './components/Section.astro';
export { default as FeatureGrid } from './components/FeatureGrid.astro';
export { default as Steps } from './components/Steps.astro';
export { default as Command } from './components/Command.astro';
export { default as Callout } from './components/Callout.astro';
export { default as ProjectGrid } from './components/ProjectGrid.astro';
export { default as CardGrid } from './components/article/CardGrid.astro';
export { default as FlowSteps } from './components/article/FlowSteps.astro';
export { default as TwoColumnCards } from './components/article/TwoColumnCards.astro';
export { default as TreeDiagram } from './components/article/TreeDiagram.astro';
export { default as TreeList } from './components/article/TreeList.astro';

export { withBase, isActive, isExternal, basePath } from './lib/url.js';
export { formatInline } from './lib/inline.js';
