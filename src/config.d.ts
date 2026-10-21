export interface Link {
  label: string;
  url: string;
}

export interface NavItem {
  label: string;
  /** Site-relative ("/docs/") — the base path is added for you — or an absolute https URL. */
  href: string;
}

export interface Owner {
  name: string;
  /** Hub (personal site) URL; the owner name in every header links here. */
  url: string;
  links: Link[];
}

export interface SiteKitConfig {
  /** Project or site name shown in the header and page titles. */
  title: string;
  description?: string;
  /** True only for the personal site: header shows the owner alone, no "Owner / Project" trail. */
  hub?: boolean;
  owner?: Partial<Owner>;
  nav?: NavItem[];
  /** Repository URL; adds a GitHub link to the header and footer. */
  repo?: string;
  /** Site-relative path of a logo image shown next to the brand (e.g. "/logo.jpg"). */
  logo?: string;
  /** Site-relative favicon path. Defaults to the kit's built-in mark. */
  favicon?: string;
  themeColor?: string;
  /** Opt-in. Off by default so privacy-first projects make no third-party requests. */
  analytics?: { goatcounter?: string };
  lang?: string;
  /** Rewrite relative links to .md files into page links (default true). */
  mdLinks?: boolean;
}

export interface ResolvedSiteKitConfig {
  title: string;
  description: string;
  hub: boolean;
  owner: Owner;
  nav: NavItem[];
  repo: string | null;
  logo: string | null;
  favicon: string | null;
  themeColor: string;
  analytics: { goatcounter: string | null };
  lang: string;
  mdLinks: boolean;
}

export declare const DEFAULT_OWNER: Owner;
export declare function resolveConfig(input: SiteKitConfig): ResolvedSiteKitConfig;
