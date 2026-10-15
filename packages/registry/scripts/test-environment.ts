import path from 'node:path';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

const REGISTRY_DIR = path.resolve(import.meta.dir, '..');
const PRIMITIVES_DIR = path.resolve(REGISTRY_DIR, '../ui/src');

const NETWORK_GLOBALS = [
  'fetch',
  'Headers',
  'Request',
  'Response',
  'FormData',
  'Blob',
  'File',
  'URL',
  'URLSearchParams',
  'AbortController',
  'AbortSignal',
] as const;
const runtimeGlobals = Object.fromEntries(NETWORK_GLOBALS.map((name) => [name, globalThis[name]]));

// Item components are rendered in the tests, so every module must see a browser from its first evaluation.
// The other tests keep the runtime's own network classes.
GlobalRegistrator.register();
Object.assign(globalThis, runtimeGlobals);
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The canonical (Radix) sources import `@/components/ui/*`, which the nearest tsconfig (the Base UI one under
// `items/`) resolves to Base UI primitives. Point those imports at the Radix primitives and the stubs.
Bun.plugin({
  name: 'radix-aliases',
  setup(build) {
    build.onLoad({ filter: /items\/.+\.radix\.tsx$/ }, async ({ path: file }) => {
      const source = await Bun.file(file).text();
      const contents = source
        .replaceAll("'@/components/ui/shuip/", `'${path.join(REGISTRY_DIR, 'stubs')}/`)
        .replaceAll("'@/components/ui/", `'${path.join(PRIMITIVES_DIR, 'components/ui')}/`)
        .replaceAll("'@/lib/utils'", `'${path.join(PRIMITIVES_DIR, 'lib/utils')}'`);
      return { contents, loader: 'tsx' };
    });
  },
});
