import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { type BaseVariantLayout, type ScannedItem, scanItems, writeBaseVariant } from './generate';

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
    layout = {
      outDir: path.join(root, 'generated', 'base'),
      itemsDir,
      primitivesDir: path.join(root, 'ui', 'ui-base'),
      utilsFile: path.join(root, 'ui', 'utils'),
    };
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  test('converts a canonical file without an override and formats the result', () => {
    write('components/alpha/component.radix.tsx', CANONICAL);
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
      path.join(itemsDir, 'lib', 'time', 'time'),
      path.join(layout.primitivesDir, 'input'),
      layout.utilsFile,
    ]);
    expect(read('consumer', 'items', 'components', 'alpha', 'default.example.base.tsx')).toContain(
      "from '@/components/ui/shuip/alpha'",
    );
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
