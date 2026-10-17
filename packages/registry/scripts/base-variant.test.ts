import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { formatWithBiome, readPathAliases, relocate, toDocsSource } from './base-variant';
import {
  type BaseVariantLayout,
  baseAliasTargets,
  buildRegistries,
  PRIMITIVES_RELOCATION,
  type ScannedItem,
  scanItems,
  writeBaseVariant,
  writeRegistries,
} from './generate';

const REGISTRY_ROOT = path.resolve(import.meta.dir, '..');
const UI_SRC = path.resolve(REGISTRY_ROOT, '../ui/src');

const CANONICAL = [
  "import { Button } from '@/components/ui/button';",
  "import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';",
  '',
  'export function Demo() {',
  '  return (',
  '    <Popover>',
  '      <PopoverTrigger asChild>',
  "        <Button variant='outline'>Open</Button>",
  '      </PopoverTrigger>',
  '      <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()}>Hello</PopoverContent>',
  '    </Popover>',
  '  );',
  '}',
  '',
].join('\n');

const OVERRIDE = CANONICAL.replace('asChild', '').replace(
  'onOpenAutoFocus={(e) => e.preventDefault()}',
  'initialFocus={false}',
);

describe('writeBaseVariant', () => {
  let root: string;
  let itemsDir: string;
  let layout: BaseVariantLayout;

  const write = (relPath: string, content: string) => {
    const abs = path.join(itemsDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };
  const read = (...segments: string[]) => fs.readFileSync(path.join(layout.outDir, ...segments), 'utf-8');
  const scanOne = () => scanItems(itemsDir)[0] as ScannedItem;
  const publishedSource = (build: ReturnType<typeof writeBaseVariant>, item: ScannedItem) =>
    fs.readFileSync(build.publishedComponentPath(item), 'utf-8');

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-base-'));
    itemsDir = path.join(root, 'items');
    layout = { outDir: path.join(root, 'generated', 'base'), itemsDir };
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  test('converts a canonical file without an override and formats the result', () => {
    write('components/alpha/component.radix.tsx', CANONICAL.replace("variant='outline'", 'variant="outline"'));
    const alpha = scanOne();

    const build = writeBaseVariant([alpha], layout);

    const published = publishedSource(build, alpha);
    expect(published).toContain("<PopoverTrigger render={<Button variant='outline' />}>Open</PopoverTrigger>");
    expect(published).not.toContain('asChild');
    expect(published).toContain("from '@/components/ui/popover'");
    expect(build.fileCounts).toEqual({ override: 0, codemod: 1, identical: 0 });
  });

  test('takes the override instead of the codemod output', () => {
    write('components/alpha/component.radix.tsx', CANONICAL);
    write('components/alpha/component.base.tsx', OVERRIDE);
    write('components/alpha/default.example.radix.tsx', CANONICAL);
    write('components/alpha/default.example.base.tsx', '// hand-written example\n');
    const alpha = scanOne();

    const build = writeBaseVariant([alpha], layout);

    expect(publishedSource(build, alpha)).toBe(OVERRIDE);
    expect(read('consumer', 'items', 'components', 'alpha', 'default.example.base.tsx')).toBe(
      '// hand-written example\n',
    );
    expect(read('items', 'components', 'alpha', 'default.example.base.tsx')).toBe('// hand-written example\n');
    expect(build.fileCounts).toEqual({ override: 2, codemod: 0, identical: 0 });
  });

  test('leaves a file the codemod does not touch identical', () => {
    write('components/alpha/component.radix.tsx', "export const alpha = 'a';\n");
    const alpha = scanOne();

    const build = writeBaseVariant([alpha], layout);

    expect(publishedSource(build, alpha)).toBe("export const alpha = 'a';\n");
    expect(build.fileCounts.identical).toBe(1);
  });

  test('rewrites the aliases of the docs copy to Base UI primitives and stubs, not those of the published copy', () => {
    write('components/alpha/component.radix.tsx', CANONICAL);
    write(
      'components/alpha/default.example.radix.tsx',
      [
        "import { Alpha } from '@/components/ui/shuip/alpha';",
        "import { Table } from '@/components/block/shuip/table';",
        "import { Field } from '@/components/ui/shuip/react-hook-form/field';",
        "import { parseTime } from '@/lib/time';",
        "import { Input } from '@/components/ui/input';",
        "import { cn } from '@/lib/utils';",
        '',
      ].join('\n'),
    );
    const alpha = scanOne();

    writeBaseVariant([alpha], layout);

    const docsDir = path.join(layout.outDir, 'items', 'components', 'alpha');
    const specifiers = [
      ...read('items', 'components', 'alpha', 'default.example.base.tsx').matchAll(/from '([^']+)'/g),
    ].map((m) => path.resolve(docsDir, m[1] as string));
    expect(specifiers).toEqual([
      path.join(layout.outDir, 'stubs', 'alpha'),
      path.join(layout.outDir, 'stubs', 'blocks', 'table'),
      path.join(layout.outDir, 'stubs', 'react-hook-form', 'field'),
      path.join(REGISTRY_ROOT, 'items', 'lib', 'time', 'time'),
      path.join(UI_SRC, 'components', 'ui-base', 'input'),
      path.join(UI_SRC, 'lib', 'utils'),
    ]);
    expect(read('consumer', 'items', 'components', 'alpha', 'default.example.base.tsx')).toContain(
      "from '@/components/ui/shuip/alpha'",
    );
  });

  test('rewrites a dynamic import and an export from in the docs copy', () => {
    write('components/alpha/component.radix.tsx', CANONICAL);
    write(
      'components/alpha/default.example.radix.tsx',
      [
        "const Lazy = React.lazy(() => import('@/components/ui/input'));",
        "export { Button } from '@/components/ui/button';",
        "import('./local');",
        '',
      ].join('\n'),
    );

    writeBaseVariant([scanOne()], layout);

    const docsDir = path.join(layout.outDir, 'items', 'components', 'alpha');
    const specifiers = [
      ...read('items', 'components', 'alpha', 'default.example.base.tsx').matchAll(/(?:from |import\()'([^']+)'/g),
    ].map((m) => m[1] as string);
    expect(specifiers.map((specifier) => path.resolve(docsDir, specifier))).toEqual([
      path.join(UI_SRC, 'components', 'ui-base', 'input'),
      path.join(UI_SRC, 'components', 'ui-base', 'button'),
      path.join(docsDir, 'local'),
    ]);
  });

  test('stubs re-export the Base UI copy of each item, and lib items get none', () => {
    write('components/alpha/component.radix.tsx', CANONICAL);
    write('lib/time/time.ts', 'export const parseTime = () => 0;\n');

    writeBaseVariant(scanItems(itemsDir), layout);

    expect(read('stubs', 'alpha.tsx')).toContain("export * from '../items/components/alpha/component.base';");
    expect(fs.readdirSync(layout.outDir, { recursive: true }).join('\n')).not.toContain('time');
  });

  test('reports a link rendered with nativeButton={false}, with its file and line', () => {
    write(
      'components/alpha/component.radix.tsx',
      '<PopoverTrigger asChild>\n  <a href="/x">Go</a>\n</PopoverTrigger>\n',
    );

    const { warnings } = writeBaseVariant([scanOne()], layout);

    expect(warnings).toEqual([
      'components/alpha/component.radix.tsx: line 1: <PopoverTrigger> renders <a> with nativeButton={false}, which Base UI discourages for links; use buttonVariants on a plain anchor',
    ]);
  });

  test('raises no drift warning outside a repository with history', () => {
    write('components/alpha/component.radix.tsx', CANONICAL);
    write('components/alpha/component.base.tsx', OVERRIDE);

    expect(writeBaseVariant(scanItems(itemsDir), layout).warnings).toEqual([]);
  });

  describe('drift guard', () => {
    const git = (...args: string[]) => {
      const result = Bun.spawnSync(
        ['git', '-c', 'user.name=t', '-c', 'user.email=t@example.test', '-c', 'commit.gpgsign=false', ...args],
        { cwd: root, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null' } },
      );
      if (result.exitCode !== 0) throw new Error(result.stderr.toString());
    };
    const commit = (message: string) => {
      git('add', '-A');
      git('commit', '-m', message);
    };
    const warningsOf = () => writeBaseVariant(scanItems(itemsDir), layout).warnings;
    const stale = (override: string, canonical: string) =>
      `components/alpha/${override} predates the latest commits of components/alpha/${canonical}: check the override still matches the canonical file`;

    beforeEach(() => {
      git('init', '-q');
      write('components/alpha/component.radix.tsx', CANONICAL);
      write('components/alpha/component.base.tsx', OVERRIDE);
      commit('add alpha');
    });

    test('stays quiet while the override is at least as recent as the canonical file', () => {
      expect(warningsOf()).toEqual([]);
    });

    test('warns when the canonical file has commits newer than the override', () => {
      write('components/alpha/component.radix.tsx', `${CANONICAL}// changed\n`);
      commit('change canonical only');

      expect(warningsOf()).toEqual([stale('component.base.tsx', 'component.radix.tsx')]);
    });

    test('goes quiet again once the override is committed after the canonical change', () => {
      write('components/alpha/component.radix.tsx', `${CANONICAL}// changed\n`);
      commit('change canonical');
      write('components/alpha/component.base.tsx', `${OVERRIDE}// followed\n`);
      commit('follow canonical');

      expect(warningsOf()).toEqual([]);
    });

    test('stays quiet for an override that is not committed yet, whatever the canonical history', () => {
      write('components/beta/component.radix.tsx', CANONICAL);
      commit('add beta');
      write('components/beta/component.radix.tsx', `${CANONICAL}// changed\n`);
      commit('change beta');
      write('components/beta/component.base.tsx', OVERRIDE);

      expect(warningsOf()).toEqual([]);
    });

    test('warns for an example override as well', () => {
      write('components/alpha/wide.example.radix.tsx', CANONICAL);
      write('components/alpha/wide.example.base.tsx', OVERRIDE);
      commit('add example');
      write('components/alpha/wide.example.radix.tsx', `${CANONICAL}// changed\n`);
      commit('change example');

      expect(warningsOf()).toEqual([stale('wide.example.base.tsx', 'wide.example.radix.tsx')]);
    });
  });
});

describe('formatWithBiome', () => {
  test('returns each code formatted, in the order given, whatever the order of the staged names', () => {
    // Twelve codes: staged as 0.tsx to 11.tsx, whose alphabetical order differs from the numeric one.
    const codes = Array.from({ length: 12 }, (_, index) => `const value${index}="text ${index}"\n`);

    expect(formatWithBiome(codes)).toEqual(codes.map((_, index) => `const value${index} = 'text ${index}';\n`));
  });

  test('returns nothing for nothing', () => {
    expect(formatWithBiome([])).toEqual([]);
  });
});

describe('toDocsSource', () => {
  const generic = { pattern: '@/components/ui/*', target: '/repo/ui/*' };
  const specific = { pattern: '@/components/ui/shuip/*', target: '/repo/stubs/*' };

  test.each([
    ['generic before specific', [generic, specific]],
    ['specific before generic', [specific, generic]],
  ])('resolves an alias to the most specific pattern, declared %s', (_, aliases) => {
    expect(
      toDocsSource(
        "import { A } from '@/components/ui/shuip/a';\nimport { B } from '@/components/ui/b';\n",
        '/repo/docs/file.tsx',
        { aliases, relocations: [] },
      ),
    ).toBe("import { A } from '../stubs/a';\nimport { B } from '../ui/b';\n");
  });
});

describe('the Base UI tsconfig of the overrides', () => {
  test('maps every alias of the registry tsconfig, to the Base UI primitives and stubs', () => {
    const { aliases, relocations } = baseAliasTargets(path.join(REGISTRY_ROOT, 'generated', 'base'));

    expect(readPathAliases(path.join(REGISTRY_ROOT, 'items', 'tsconfig.json'))).toEqual([
      ...aliases.map(({ pattern, target }) => ({ pattern, target: relocate(target, relocations) })),
      // The Base UI primitives import their siblings through this alias, which no registry source uses.
      {
        pattern: `@/components/${path.basename(PRIMITIVES_RELOCATION.to)}/*`,
        target: path.join(PRIMITIVES_RELOCATION.to, '*'),
      },
    ]);
  });
});

describe('the published registries', () => {
  const EXTRA_ITEM = { name: 'aaa-skill', type: 'registry:item' as const };
  let root: string;
  let itemsDir: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-registries-'));
    itemsDir = path.join(root, 'items');
    for (const name of ['alpha', 'beta']) {
      fs.mkdirSync(path.join(itemsDir, 'components', name), { recursive: true });
      fs.writeFileSync(path.join(itemsDir, 'components', name, 'component.radix.tsx'), CANONICAL);
    }
    fs.writeFileSync(path.join(itemsDir, 'components', 'alpha', 'component.base.tsx'), OVERRIDE);
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  const publish = (extraItems = [EXTRA_ITEM]) => {
    const items = scanItems(itemsDir);
    const build = writeBaseVariant(items, { outDir: path.join(root, 'generated', 'base'), itemsDir });
    return buildRegistries({ items, catalog: {}, publishedComponentPath: build.publishedComponentPath, extraItems });
  };
  const fileOf = (registry: { items: { name: string; files?: { path: string }[] }[] }, name: string) =>
    path.resolve(REGISTRY_ROOT, registry.items.find((item) => item.name === name)?.files?.[0]?.path ?? '');

  test('the radix registry points at the canonical files and the base one at the Base UI files', () => {
    const registries = publish();

    expect(fileOf(registries.radix, 'alpha')).toBe(path.join(itemsDir, 'components/alpha/component.radix.tsx'));
    expect(fs.readFileSync(fileOf(registries.base, 'alpha'), 'utf-8')).toBe(OVERRIDE);
    expect(fs.readFileSync(fileOf(registries.base, 'beta'), 'utf-8')).toContain('render={<Button');
    expect(fs.readFileSync(fileOf(registries.radix, 'beta'), 'utf-8')).toContain('asChild');
  });

  test('both registries list the same items plus the extra ones, sorted', () => {
    const registries = publish();

    expect(registries.base.items.map((item) => item.name)).toEqual(['aaa-skill', 'alpha', 'beta']);
    expect(registries.radix.items.map((item) => item.name)).toEqual(['aaa-skill', 'alpha', 'beta']);
  });

  test('orders items by code unit, whatever the locale of the machine', () => {
    const registries = publish([EXTRA_ITEM, { name: 'Zed', type: 'registry:item' }]);

    expect(registries.radix.items.map((item) => item.name)).toEqual(['Zed', 'aaa-skill', 'alpha', 'beta']);
    expect(registries.base.items.map((item) => item.name)).toEqual(['Zed', 'aaa-skill', 'alpha', 'beta']);
  });

  test('rejects an extra item named like an item', () => {
    expect(() => publish([{ name: 'alpha', type: 'registry:item' }])).toThrow();
  });

  test('writes each registry to the file of its variant', () => {
    const registries = publish();

    writeRegistries(root, registries);

    const written = (file: string) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf-8'));
    expect(written('registry.json')).toEqual(registries.radix);
    expect(written('registry.base.json')).toEqual(registries.base);
    expect(written('registry.base.json')).not.toEqual(written('registry.json'));
  });
});
