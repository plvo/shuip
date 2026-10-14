import { afterAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { buildRegistryJson, readRootCatalog, type ScannedItem, scanItems, writeBaseVariant } from './generate';
import { RADIX_PACKAGE } from './radix-package';

const REPO_ROOT = path.resolve(import.meta.dir, '../../..');
const BLOCK_DOCS_DIR = path.join(REPO_ROOT, 'apps/docs/content/blocks');

/** Sources whose component sets its own `data-state`, so styling on it is not a primitive trigger. */
const OWN_DATA_STATE = ['packages/registry/items/components/side-dialog/component.radix.tsx'];

const FORM_PRIMITIVE = /^@\/components\/ui\/form(\/|$)/;
const PRIMITIVE_STATE_CLASS = /data-\[state=/;
const RADIX_ONLY_POPOVER_API =
  /\b(?:PopoverAnchor|onOpenAutoFocus|onCloseAutoFocus|onInteractOutside|onPointerDownOutside|onEscapeKeyDown)\b|--radix-/;
const IMPORT_SPECIFIER = /(?:\bfrom\s+|\bimport\s*\(?\s*|\brequire\(\s*)['"]([^'"]+)['"]/g;
const FENCED_CODE_BLOCK = /^[ \t]*(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^[ \t]*\1[ \t]*$/gm;

/** A shipped source file is checked in full; a doc page only through the code in its fenced blocks. */
interface SourceFile {
  relativePath: string;
  kind: 'source' | 'doc';
  content: string;
}

const readSource = (absPath: string, kind: SourceFile['kind']): SourceFile => ({
  relativePath: path.relative(REPO_ROOT, absPath).split(path.sep).join('/'),
  kind,
  content: fs.readFileSync(absPath, 'utf-8'),
});

const overridePaths = (item: ScannedItem) => [
  ...(item.componentOverridePath ? [item.componentOverridePath] : []),
  ...item.examples.flatMap((example) => (example.overridePath ? [example.overridePath] : [])),
];

const itemSourcePaths = (item: ScannedItem) => [
  item.componentPath,
  ...item.examples.map((example) => example.absPath),
  ...item.extras.map((extra) => extra.absPath),
  ...overridePaths(item),
];

const itemDocPaths = (item: ScannedItem) => (item.hasMdx ? [path.join(item.itemDir, 'index.mdx')] : []);

const blockDocPaths = () =>
  fs
    .readdirSync(BLOCK_DOCS_DIR)
    .filter((filename) => filename.endsWith('.mdx'))
    .map((filename) => path.join(BLOCK_DOCS_DIR, filename));

const codeBlocks = (markdown: string) =>
  [...markdown.matchAll(FENCED_CODE_BLOCK)].map((m) => m[2] as string).join('\n');

const importedSpecifiers = ({ kind, content }: SourceFile) =>
  [...(kind === 'doc' ? codeBlocks(content) : content).matchAll(IMPORT_SPECIFIER)].map((m) => m[1] as string);

const findViolations = (sources: SourceFile[]) => ({
  radixImports: sources.filter((s) => importedSpecifiers(s).some((spec) => RADIX_PACKAGE.test(spec))),
  formPrimitiveImports: sources.filter((s) => importedSpecifiers(s).some((spec) => FORM_PRIMITIVE.test(spec))),
  primitiveStateClasses: sources.filter(
    (s) => s.kind === 'source' && PRIMITIVE_STATE_CLASS.test(s.content) && !OWN_DATA_STATE.includes(s.relativePath),
  ),
});

const paths = (sources: SourceFile[]) => sources.map((s) => s.relativePath);

describe('item sources stay base-agnostic', () => {
  const items = scanItems();
  const sources = items.flatMap(itemSourcePaths).map((absPath) => readSource(absPath, 'source'));
  const docs = [...items.flatMap(itemDocPaths), ...blockDocPaths()].map((absPath) => readSource(absPath, 'doc'));
  const violations = findViolations([...sources, ...docs]);

  test('scans the main file of every item, including lib items', () => {
    const mainFiles = items.map((item) => readSource(item.componentPath, 'source').relativePath);
    expect(mainFiles).toHaveLength(items.length);
    expect(paths(sources)).toEqual(expect.arrayContaining(mainFiles));
    expect(mainFiles).toContain('packages/registry/items/lib/time/time.ts');
  });

  test('scans every example and every extra', () => {
    const exampleCount = items.reduce((count, item) => count + item.examples.length, 0);
    const extraCount = items.reduce((count, item) => count + item.extras.length, 0);
    const overrideCount = items.reduce((count, item) => count + overridePaths(item).length, 0);
    expect(extraCount).toBeGreaterThan(0);
    expect(sources).toHaveLength(items.length + exampleCount + extraCount + overrideCount);
    expect(paths(sources)).toContain('packages/registry/items/react-hook-form/address-field/extras/places.action.ts');
  });

  test('scans the Base UI overrides', () => {
    expect(paths(sources)).toContain('packages/registry/items/components/search-input/component.base.tsx');
  });

  test('scans the doc page of every item and of every block', () => {
    const itemDocCount = items.filter((item) => item.hasMdx).length;
    const blockDocs = blockDocPaths();
    expect(itemDocCount).toBeGreaterThan(0);
    expect(blockDocs.length).toBeGreaterThan(0);
    expect(docs).toHaveLength(itemDocCount + blockDocs.length);
  });

  test('no source or doc snippet imports a Radix package', () => {
    expect(paths(violations.radixImports)).toEqual([]);
  });

  test('no source or doc snippet imports the form primitive', () => {
    expect(paths(violations.formPrimitiveImports)).toEqual([]);
  });

  test('no source styles a primitive trigger through data-[state=', () => {
    expect(paths(violations.primitiveStateClasses)).toEqual([]);
  });

  test.each(OWN_DATA_STATE)('%s still sets its own data-state', (relativePath) => {
    const own = sources.find((s) => s.relativePath === relativePath);
    expect(own?.content).toMatch(/\bdata-state=\{/);
  });
});

const asChildSites = (relativePath: string, content: string): string[] => {
  const file = ts.createSourceFile(relativePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const sites: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isJsxAttribute(node) && node.name.getText(file) === 'asChild') {
      const tag = (node.parent.parent as ts.JsxOpeningLikeElement).tagName.getText(file);
      sites.push(`${relativePath} <${tag} asChild${node.initializer ? '={…}' : ''}>`);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return sites;
};

describe('the Base UI variant stays free of Radix', () => {
  const items = scanItems();
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-base-invariants-'));
  const build = writeBaseVariant(items, { outDir, itemsDir: path.join(REPO_ROOT, 'packages/registry/items') });
  afterAll(() => fs.rmSync(outDir, { recursive: true, force: true }));

  const generatedFiles = fs
    .readdirSync(outDir, { recursive: true, encoding: 'utf-8' })
    .filter((entry) => entry.endsWith('.tsx'))
    .map((entry) => readSource(path.join(outDir, entry), 'source'));

  test('writes the published and the docs copy of every component and example', () => {
    const exampleCount = items.reduce((count, item) => count + item.examples.length, 0);
    const variantItems = items.filter((item) => item.category !== 'lib');
    const copies = generatedFiles.filter((file) => /\/(?:consumer\/)?items\//.test(file.relativePath));
    expect(copies).toHaveLength(2 * (variantItems.length + exampleCount));
  });

  test('no generated file imports a Radix package', () => {
    expect(paths(findViolations(generatedFiles).radixImports)).toEqual([]);
  });

  test('no generated file imports the form primitive', () => {
    expect(paths(findViolations(generatedFiles).formPrimitiveImports)).toEqual([]);
  });

  test('no generated file uses a Radix-only Popover API', () => {
    const offenders = generatedFiles.filter((file) => RADIX_ONLY_POPOVER_API.test(file.content));
    expect(paths(offenders)).toEqual([]);
  });

  // A site listed here keeps its Radix `asChild` in the Base UI output until an override or the canonical source
  // composes it differently. A new site fails this test: override it, or list it after checking it composes.
  test('only the known sites keep asChild in the published Base UI sources', () => {
    const consumerDir = path.join(outDir, 'consumer', 'items');
    const remaining = fs
      .readdirSync(consumerDir, { recursive: true, encoding: 'utf-8' })
      .filter((entry) => entry.endsWith('.tsx'))
      .flatMap((entry) => asChildSites(entry, fs.readFileSync(path.join(consumerDir, entry), 'utf-8')));
    expect(remaining.sort()).toEqual([
      'blocks/responsive-dialog/component.base.tsx <DrawerClose asChild={…}>',
      'blocks/responsive-dialog/component.base.tsx <DrawerTrigger asChild={…}>',
      'blocks/responsive-dialog/component.base.tsx <SideDialogClose asChild={…}>',
      'blocks/responsive-dialog/component.base.tsx <SideDialogTrigger asChild={…}>',
      'components/confirmation-dialog/component.base.tsx <DialogTrigger asChild>',
    ]);
  });

  test('every item is published in the Base UI variant, from files that exist', () => {
    const radix = buildRegistryJson(items, readRootCatalog());
    const base = buildRegistryJson(items, readRootCatalog(), build.publishedComponentPath);
    expect(base.items.map((item) => item.name)).toEqual(radix.items.map((item) => item.name));
    const missing = base.items.flatMap((item) =>
      (item.files ?? [])
        .map((file) => path.resolve(path.join(REPO_ROOT, 'packages/registry'), file.path))
        .filter((file) => !fs.existsSync(file)),
    );
    expect(missing).toEqual([]);
  });

  test('no published Base UI entry depends on a Radix package', () => {
    const offenders = buildRegistryJson(items, readRootCatalog(), build.publishedComponentPath).items.flatMap((item) =>
      (item.dependencies ?? []).filter((dep) => RADIX_PACKAGE.test(dep)).map((dep) => `${item.name} -> ${dep}`),
    );
    expect(offenders).toEqual([]);
  });
});

describe('invariant detection', () => {
  const source = (relativePath: string, content: string): SourceFile => ({ relativePath, kind: 'source', content });
  const doc = (relativePath: string, content: string): SourceFile => ({ relativePath, kind: 'doc', content });

  test.each([
    ['named import', "import { Slot } from 'radix-ui';"],
    ['namespace import', "import * as Select from '@radix-ui/react-select';"],
    ['subpath import', "import { Slot } from 'radix-ui/internal';"],
    ['type-only import', "import type { Root } from '@radix-ui/react-popover';"],
    ['inline type import', "import { type Root } from 'radix-ui';"],
    ['named re-export', "export { Slot } from 'radix-ui';"],
    ['star re-export', "export * from '@radix-ui/react-icons';"],
    ['side-effect import', "import '@radix-ui/react-select';"],
    ['dynamic import', "const select = await import('@radix-ui/react-select');"],
    ['require', "const { Slot } = require('radix-ui');"],
    ['multi-line import', "import {\n  Root,\n  Trigger,\n} from '@radix-ui/react-popover';"],
    ['versioned package', "import { Slot } from 'radix-ui@1.0.0';"],
  ])('flags a Radix %s', (_, content) => {
    expect(paths(findViolations([source('a.tsx', content)]).radixImports)).toEqual(['a.tsx']);
  });

  test.each([
    '<PopoverAnchor asChild>',
    'onOpenAutoFocus={(e) => e.preventDefault()}',
    'onCloseAutoFocus={(e) => e.preventDefault()}',
    'onInteractOutside={() => {}}',
    'onPointerDownOutside={() => {}}',
    'onEscapeKeyDown={() => {}}',
    "style={{ width: 'var(--radix-popover-trigger-width)' }}",
    "style={{ height: 'var(--radix-popper-available-height)' }}",
  ])('flags the Radix-only Popover API in %s', (content) => {
    expect(RADIX_ONLY_POPOVER_API.test(content)).toBe(true);
  });

  test('does not flag the Base UI Popover API', () => {
    expect(RADIX_ONLY_POPOVER_API.test("<Positioner anchor={ref} /> initialFocus={false} 'var(--anchor-width)'")).toBe(
      false,
    );
  });

  test('does not flag other imports', () => {
    const flagged = findViolations([
      source('a.tsx', "import { Button } from '@/components/ui/button';\nimport { cn } from '@/lib/utils';"),
      source('b.tsx', "import type { Metadata } from 'next';\nexport * from './local';"),
    ]).radixImports;
    expect(flagged).toEqual([]);
  });

  test.each([
    ['named import', "import { Form } from '@/components/ui/form';"],
    ['type-only import', "import type { FormFieldProps } from '@/components/ui/form';"],
    ['re-export', "export { Form } from '@/components/ui/form';"],
    ['side-effect import', "import '@/components/ui/form';"],
    ['multi-line import', "import {\n  Form,\n  FormField,\n} from '@/components/ui/form';"],
  ])('flags a form primitive %s', (_, content) => {
    expect(paths(findViolations([source('a.tsx', content)]).formPrimitiveImports)).toEqual(['a.tsx']);
  });

  test('does not flag form-named modules that are not the primitive', () => {
    const flagged = findViolations([
      source('a.tsx', "import { Field } from '@/components/ui/field';"),
      source('b.tsx', "import { FormProvider } from 'react-hook-form';"),
      source('c.tsx', "import { formOptions } from '@tanstack/react-form';"),
    ]).formPrimitiveImports;
    expect(flagged).toEqual([]);
  });

  test('flags data-[state= in a source, except the one that sets its own data-state', () => {
    const flagged = findViolations([
      source('packages/registry/items/blocks/a/component.radix.tsx', "cn('data-[state=open]:bg-accent')"),
      source('packages/registry/items/components/side-dialog/component.radix.tsx', "cn('data-[state=open]:x')"),
      source('packages/registry/items/components/side-dialog/default.example.radix.tsx', "cn('data-[state=open]:x')"),
    ]).primitiveStateClasses;
    expect(paths(flagged)).toEqual([
      'packages/registry/items/blocks/a/component.radix.tsx',
      'packages/registry/items/components/side-dialog/default.example.radix.tsx',
    ]);
  });

  test('flags imports inside a fenced code block of a doc page', () => {
    const page = [
      '# Title',
      '',
      '```tsx',
      "import { Slot } from 'radix-ui';",
      "import { Form } from '@/components/ui/form';",
      '```',
    ].join('\n');
    const violations = findViolations([doc('a.mdx', page)]);
    expect(paths(violations.radixImports)).toEqual(['a.mdx']);
    expect(paths(violations.formPrimitiveImports)).toEqual(['a.mdx']);
  });

  test('flags imports inside an indented and a tilde fenced block', () => {
    const page = ['<Tab>', '  ```tsx', "  import { Slot } from 'radix-ui';", '  ```', '</Tab>'].join('\n');
    const tilde = ['~~~ts', "import { Form } from '@/components/ui/form';", '~~~'].join('\n');
    const violations = findViolations([doc('a.mdx', page), doc('b.mdx', tilde)]);
    expect(paths(violations.radixImports)).toEqual(['a.mdx']);
    expect(paths(violations.formPrimitiveImports)).toEqual(['b.mdx']);
  });

  test('ignores a doc mention outside fenced code', () => {
    const page = "The old `import { Form } from '@/components/ui/form'` is gone; radix-ui is not used.";
    const violations = findViolations([doc('a.mdx', page)]);
    expect(violations.radixImports).toEqual([]);
    expect(violations.formPrimitiveImports).toEqual([]);
  });

  test('does not apply the data-[state= rule to doc pages', () => {
    const page = ['```tsx', "cn('data-[state=open]:bg-accent')", '```'].join('\n');
    expect(findViolations([doc('a.mdx', page)]).primitiveStateClasses).toEqual([]);
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
