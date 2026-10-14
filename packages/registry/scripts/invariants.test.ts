import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { buildRegistryJson, readRootCatalog, scanItems } from './generate';

const ITEMS_DIR = path.resolve(import.meta.dir, '../items');
const COMPONENT_FILE = 'component.radix.tsx';
const EXAMPLE_FILE = /\.example\.radix\.tsx$/;

/** Item folders whose component sets its own `data-state`, so styling on it is not a primitive trigger. */
const OWN_DATA_STATE = ['components/side-dialog'];

const RADIX_PACKAGE = /^(@radix-ui\/|radix-ui(\/|@|$))/;
const FORM_PRIMITIVE = /^@\/components\/ui\/form(\/|$)/;
const PRIMITIVE_STATE_CLASS = /data-\[state=/;
const IMPORT_SPECIFIER = /(?:\bfrom\s+|\bimport\s*\(?\s*|\brequire\(\s*)['"]([^'"]+)['"]/g;

interface SourceFile {
  relativePath: string;
  itemDir: string;
  content: string;
}

const listFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const abs = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(abs) : [abs];
  });

const isItemSource = (absPath: string) => {
  const filename = path.basename(absPath);
  const insideExtras = path.relative(ITEMS_DIR, absPath).split(path.sep).includes('extras');
  return filename === COMPONENT_FILE || EXAMPLE_FILE.test(filename) || insideExtras;
};

const collectSources = (itemsDir: string): SourceFile[] =>
  listFiles(itemsDir)
    .filter(isItemSource)
    .map((absPath) => {
      const relativePath = path.relative(itemsDir, absPath).split(path.sep).join('/');
      const [category, name] = relativePath.split('/');
      return { relativePath, itemDir: `${category}/${name}`, content: fs.readFileSync(absPath, 'utf-8') };
    });

const importedSpecifiers = (content: string) => [...content.matchAll(IMPORT_SPECIFIER)].map((m) => m[1] as string);

const findViolations = (sources: SourceFile[]) => ({
  radixImports: sources.filter((s) => importedSpecifiers(s.content).some((spec) => RADIX_PACKAGE.test(spec))),
  formPrimitiveImports: sources.filter((s) => importedSpecifiers(s.content).some((spec) => FORM_PRIMITIVE.test(spec))),
  primitiveStateClasses: sources.filter(
    (s) => PRIMITIVE_STATE_CLASS.test(s.content) && !OWN_DATA_STATE.includes(s.itemDir),
  ),
});

const paths = (sources: SourceFile[]) => sources.map((s) => s.relativePath);

describe('item sources stay base-agnostic', () => {
  const sources = collectSources(ITEMS_DIR);
  const violations = findViolations(sources);

  test('scans component and example sources', () => {
    expect(sources.some((s) => s.relativePath.endsWith(COMPONENT_FILE))).toBe(true);
    expect(sources.some((s) => EXAMPLE_FILE.test(s.relativePath))).toBe(true);
  });

  test('no source imports a Radix package', () => {
    expect(paths(violations.radixImports)).toEqual([]);
  });

  test('no source imports the form primitive', () => {
    expect(paths(violations.formPrimitiveImports)).toEqual([]);
  });

  test('no source styles a primitive trigger through data-[state=', () => {
    expect(paths(violations.primitiveStateClasses)).toEqual([]);
  });

  test.each(OWN_DATA_STATE)('%s still sets its own data-state', (itemDir) => {
    const own = sources.filter((s) => s.itemDir === itemDir && /\bdata-state=\{/.test(s.content));
    expect(own.length).toBeGreaterThan(0);
  });
});

describe('invariant detection', () => {
  const source = (relativePath: string, content: string): SourceFile => ({
    relativePath,
    itemDir: relativePath.split('/').slice(0, 2).join('/'),
    content,
  });

  test('flags Radix imports in every import form', () => {
    const flagged = findViolations([
      source('components/a/component.radix.tsx', "import { Slot } from 'radix-ui';"),
      source('components/b/component.radix.tsx', "import * as X from '@radix-ui/react-select';"),
      source('components/c/component.radix.tsx', "import { Slot } from 'radix-ui/internal';"),
      source('components/d/component.radix.tsx', "const x = await import('@radix-ui/react-icons');"),
      source('components/e/component.radix.tsx', "import { Button } from '@/components/ui/button';"),
    ]).radixImports;
    expect(paths(flagged)).toEqual([
      'components/a/component.radix.tsx',
      'components/b/component.radix.tsx',
      'components/c/component.radix.tsx',
      'components/d/component.radix.tsx',
    ]);
  });

  test('flags the form primitive but not other form-named modules', () => {
    const flagged = findViolations([
      source('react-hook-form/a/default.example.radix.tsx', "import { Form } from '@/components/ui/form';"),
      source('react-hook-form/b/default.example.radix.tsx', "import { Field } from '@/components/ui/field';"),
      source('react-hook-form/c/default.example.radix.tsx', "import { FormProvider } from 'react-hook-form';"),
    ]).formPrimitiveImports;
    expect(paths(flagged)).toEqual(['react-hook-form/a/default.example.radix.tsx']);
  });

  test('flags data-[state= outside the allowlist only', () => {
    const flagged = findViolations([
      source('blocks/a/component.radix.tsx', "cn('data-[state=open]:bg-accent')"),
      source('components/side-dialog/component.radix.tsx', "cn('data-[state=open]:animate-in')"),
    ]).primitiveStateClasses;
    expect(paths(flagged)).toEqual(['blocks/a/component.radix.tsx']);
  });
});

describe('published registry entries', () => {
  const { items } = buildRegistryJson(scanItems(), readRootCatalog());

  test('no entry depends on a Radix package', () => {
    const offenders = items.flatMap((item) =>
      (item.dependencies ?? []).filter((dep) => RADIX_PACKAGE.test(dep)).map((dep) => `${item.name} -> ${dep}`),
    );
    expect(offenders).toEqual([]);
  });
});
