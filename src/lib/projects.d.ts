export type ProjectStatus = 'active' | 'beta' | 'experimental' | 'archived';

export interface Project {
  name: string;
  tagline: string;
  /** "owner/name" */
  repo: string;
  /** Live page, when the project has one. */
  url: string | null;
  status: ProjectStatus;
  tags: string[];
  order: number;
}

export declare const STATUSES: ProjectStatus[];
export declare function parseProject(raw: unknown, source?: string): Project;
export declare function loadProjects(
  repos: string[],
  options?: { owner?: string; fetch?: typeof fetch; warn?: (msg: string) => void },
): Promise<Project[]>;
