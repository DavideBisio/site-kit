import type { AstroIntegration } from 'astro';
import type { SiteKitConfig } from './config';

export type { SiteKitConfig, ResolvedSiteKitConfig, NavItem, Owner, Link } from './config';
export default function siteKit(config: SiteKitConfig): AstroIntegration;
