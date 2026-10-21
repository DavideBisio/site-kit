import { docsCollection } from '@davidebisio/site-kit/content';

// Docs pages live in src/content/docs. To publish Markdown already in the repo instead,
// point the collection at it, e.g. docsCollection({ base: '../docs' }).
export const collections = {
  docs: docsCollection(),
};
