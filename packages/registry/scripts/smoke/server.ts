import path from 'node:path';
import { rewrittenPathname } from '@repo/registry/style-base';

export interface RegistryServer {
  origin: string;
  /** Request paths answered with a file, as requested by the client. */
  servedPaths: ReadonlySet<string>;
  stop: () => void;
}

const segmentsOf = (pathname: string): string[] => pathname.split('/');

// A rewrite whose decoded `:name` brings in a separator or a dot segment is not an item request.
const isRewriteSafe = (requested: string, rewritten: string): boolean =>
  segmentsOf(requested).length === segmentsOf(rewritten).length &&
  !rewritten.includes('\\') &&
  !rewritten.includes('..');

const isInside = (directory: string, file: string): boolean => file.startsWith(`${directory}${path.sep}`);

/** Serves the built registry (`<publicDir>/r/...`) on loopback with the production style rewrites. */
export const serveRegistry = (publicDir: string): RegistryServer => {
  const root = path.resolve(publicDir);
  const servedPaths = new Set<string>();

  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch: async (request) => {
      const requested = new URL(request.url).pathname;
      const rewritten = rewrittenPathname(requested);
      if (rewritten !== null && !isRewriteSafe(requested, rewritten)) {
        return new Response('Not found', { status: 404 });
      }

      const target = path.resolve(root, `.${rewritten ?? requested}`);
      const file = Bun.file(target);
      if (!isInside(root, target) || !(await file.exists())) {
        return new Response('Not found', { status: 404 });
      }
      servedPaths.add(requested);
      return new Response(file);
    },
  });

  return { origin: server.url.origin, servedPaths, stop: () => void server.stop(true) };
};
