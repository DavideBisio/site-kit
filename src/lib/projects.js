// Project registry. Every project repo keeps a project.json at its root (the template and
// `site-kit init` create it). The hub site reads them at build time to list projects,
// so a new project appears on the personal site without editing it.
//
//   import { loadProjects } from '@davidebisio/site-kit/projects';
//   const projects = await loadProjects(['garmin-run-progress', 'budget-planner']);

export const STATUSES = ['active', 'beta', 'experimental', 'archived'];

/**
 * Validate one project.json. Returns a normalized project, or throws with every
 * problem listed.
 * @param {unknown} raw
 * @param {string} [source]  for error messages
 * @returns {import('./projects').Project}
 */
export function parseProject(raw, source = 'project.json') {
  const errors = [];
  const p = /** @type {Record<string, any>} */ (raw && typeof raw === 'object' ? raw : {});
  const str = (k, required) => {
    if (p[k] == null) return required ? (errors.push(`"${k}" is required`), '') : undefined;
    if (typeof p[k] !== 'string' || !p[k].trim()) errors.push(`"${k}" must be a non-empty string`);
    return p[k];
  };

  const project = {
    name: str('name', true),
    tagline: str('tagline', true),
    repo: str('repo', true),
    url: str('url', false) ?? null,
    status: str('status', false) ?? 'active',
    tags: Array.isArray(p.tags) ? p.tags : [],
    order: typeof p.order === 'number' ? p.order : 100,
  };

  if (project.repo && !/^[\w.-]+\/[\w.-]+$/.test(project.repo)) errors.push('"repo" must be "owner/name"');
  if (project.url && !/^https:\/\//.test(project.url)) errors.push('"url" must be an https URL');
  if (!STATUSES.includes(project.status)) errors.push(`"status" must be one of ${STATUSES.join(', ')}`);
  if (!project.tags.every((t) => typeof t === 'string')) errors.push('"tags" must be strings');
  if (errors.length) throw new Error(`site-kit: invalid ${source}: ${errors.join('; ')}`);
  return project;
}

/**
 * Fetch project.json from each repo's default branch. A repo that has none (or fails to
 * load) is skipped with a warning rather than failing the hub build.
 * @param {string[]} repos  repo names (owner defaults to DavideBisio) or "owner/name"
 * @param {{ owner?: string, fetch?: typeof fetch, warn?: (msg: string) => void }} [options]
 */
export async function loadProjects(repos, { owner = 'DavideBisio', fetch: fetchFn = fetch, warn = console.warn } = {}) {
  const results = await Promise.all(
    repos.map(async (entry) => {
      const full = entry.includes('/') ? entry : `${owner}/${entry}`;
      const url = `https://raw.githubusercontent.com/${full}/HEAD/project.json`;
      try {
        const res = await fetchFn(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return parseProject(await res.json(), `${full}/project.json`);
      } catch (err) {
        warn(`site-kit: skipping ${full}: ${err instanceof Error ? err.message : err}`);
        return null;
      }
    }),
  );
  return results.filter(Boolean).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
