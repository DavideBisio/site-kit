export interface DocsEntryData {
  title?: string;
  description?: string;
  group?: string;
  order: number;
  draft: boolean;
}

export interface DocsNavItem {
  id: string;
  title: string;
  href: string;
  group: string;
  order: number;
}

export interface DocsNavGroup {
  /** Empty string for ungrouped pages. */
  label: string;
  items: DocsNavItem[];
}

export declare const docsSchema: import('astro/zod').ZodType<DocsEntryData>;
export declare function docsCollection(options?: { base?: string; pattern?: string | string[] }): any;
export declare function docTitle(entry: { id: string; data: { title?: string }; body?: string }): string;
export declare function docsNav<E extends { id: string; data: any; body?: string }>(
  entries: E[],
  href: (entry: E) => string,
): DocsNavGroup[];
export declare function editLink(repo: string, filePath: string | undefined, options?: { siteDir?: string; branch?: string }): string | undefined;
