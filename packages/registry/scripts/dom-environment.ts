import path from 'node:path';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { readPathAliases, toDocsSource } from './base-variant';

const REGISTRY_DIR = path.resolve(import.meta.dir, '..');
const CANONICAL_TSCONFIG = path.join(REGISTRY_DIR, 'tsconfig.json');

/** Gives the calling test file a browser. Call it before importing the components that render in it. */
export function installDom(): () => Promise<void> {
  GlobalRegistrator.register();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  return () => GlobalRegistrator.unregister();
}

/**
 * Resolves the aliases of the matching canonical sources through the registry tsconfig, so they get the Radix
 * primitives. Bun otherwise resolves them through `items/tsconfig.json`, the Base UI one. Only the files matching
 * `filter` are rewritten, so other test files keep their own resolution.
 */
export function resolveCanonicalAliases(filter: RegExp): void {
  const targets = { aliases: readPathAliases(CANONICAL_TSCONFIG), relocations: [] };
  Bun.plugin({
    name: 'canonical-aliases',
    setup(build) {
      build.onLoad({ filter }, async ({ path: file }) => ({
        contents: toDocsSource(await Bun.file(file).text(), file, targets),
        loader: 'tsx',
      }));
    },
  });
}
