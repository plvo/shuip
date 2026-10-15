import type { Base } from './base-routes';

export const BASE_ONLY_BLOCK = /<BaseOnly base="(\w+)">([\s\S]*?)<\/BaseOnly>/g;

/** Keeps the `<BaseOnly>` blocks written for `base` and drops the others, for markdown that is read outside the page. */
export const resolveBaseOnly = (markdown: string, base: Base): string =>
  markdown.replace(BASE_ONLY_BLOCK, (_block, blockBase: string, content: string) =>
    blockBase === base ? content.trim() : '',
  );
