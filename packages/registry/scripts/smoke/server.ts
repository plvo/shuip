import path from 'node:path';
import { styleRewrites } from '@repo/registry/style-base';
import { match } from 'next/dist/compiled/path-to-regexp';

const rewrittenPathname = (pathname: string): string => {
  for (const { source, destination } of styleRewrites()) {
    const matched = match(source, { decode: decodeURIComponent })(pathname);
    if (matched) {
      const params = matched.params as Record<string, string>;
      return destination.replace(/:(\w+)/g, (_, key: string) => params[key]);
    }
  }
  return pathname;
};

/** Serves the built registry (`<publicDir>/r/...`) with the production style rewrites. */
export const serveRegistry = (publicDir: string): Bun.Server<undefined> => {
  return Bun.serve({
    port: 0,
    fetch: async (request) => {
      const file = Bun.file(path.join(publicDir, rewrittenPathname(new URL(request.url).pathname)));
      return (await file.exists()) ? new Response(file) : new Response('Not found', { status: 404 });
    },
  });
};
