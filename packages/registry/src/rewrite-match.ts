import { match } from 'next/dist/compiled/path-to-regexp';
import { type StyleRewrite, styleRewrites } from './style-base';

/**
 * Applies the first matching rewrite to a request pathname with the matcher Next uses for `rewrites`.
 * Returns null when no rewrite matches. For tests and the local smoke server only: Next internals are untyped.
 */
export const rewrittenPathname = (pathname: string, rewrites: StyleRewrite[] = styleRewrites()): string | null => {
  for (const { source, destination } of rewrites) {
    const matched = match(source, { decode: decodeURIComponent })(pathname);
    if (matched) {
      const params = matched.params as Record<string, string>;
      return destination.replace(/:(\w+)/g, (_, key: string) => params[key]);
    }
  }
  return null;
};
