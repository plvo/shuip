import { afterAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { buildRegistryJson, readRootCatalog, type ScannedItem, scanItems, writeBaseVariant } from './generate';
import { attributeValues, elementsMatching, namedImports, parseTsx } from './jsx-source';
import { RADIX_PACKAGE } from './radix-package';

const REPO_ROOT = path.resolve(import.meta.dir, '../../..');
const BLOCK_DOCS_DIR = path.join(REPO_ROOT, 'apps/docs/content/blocks');
const GUIDE_DOCS_DIR = path.join(REPO_ROOT, 'apps/docs/content/docs');
const RHF_GUIDE_DOC = path.join(REPO_ROOT, 'apps/docs/content/components/react-hook-form/index.mdx');
const FORMS_SKILL_DOC = path.join(REPO_ROOT, 'packages/registry/skills/shuip-forms/SKILL.md');

/** Sources whose component sets its own `data-state`, so styling on it is not a primitive trigger. */
const OWN_DATA_STATE: string[] = [];

const FORM_PRIMITIVE = /^@\/components\/ui\/form(\/|$)/;
const PRIMITIVE_STATE_CLASS = /data-\[state=/;
const OPACITY_CLASS = /(?<![\w-])opacity-/;
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

const itemExamplePaths = (item: ScannedItem) =>
  item.examples.flatMap((example) => [example.absPath, ...(example.overridePath ? [example.overridePath] : [])]);

const itemDocPaths = (item: ScannedItem) => (item.hasMdx ? [path.join(item.itemDir, 'index.mdx')] : []);

const mdxPathsIn = (dir: string) =>
  fs
    .readdirSync(dir)
    .filter((filename) => filename.endsWith('.mdx'))
    .map((filename) => path.join(dir, filename));

const blockDocPaths = () => mdxPathsIn(BLOCK_DOCS_DIR);

const itemAndBlockDocPaths = (items: ScannedItem[]) => [...items.flatMap(itemDocPaths), ...blockDocPaths()];

const guideDocPaths = () => [...mdxPathsIn(GUIDE_DOCS_DIR), RHF_GUIDE_DOC, FORMS_SKILL_DOC];

const codeBlocks = (markdown: string) =>
  [...markdown.matchAll(FENCED_CODE_BLOCK)].map((m) => m[2] as string).join('\n');

const code = ({ kind, content }: SourceFile) => (kind === 'doc' ? codeBlocks(content) : content);

const importedSpecifiers = (file: SourceFile) => [...code(file).matchAll(IMPORT_SPECIFIER)].map((m) => m[1] as string);

const hasFieldErrorWithOpacity = (file: SourceFile) =>
  file.content.includes('FieldError') &&
  attributeValues(parseTsx(file.relativePath, code(file)), 'FieldError', 'className').some((classes) =>
    OPACITY_CLASS.test(classes),
  );

const findViolations = (sources: SourceFile[]) => ({
  radixImports: sources.filter((s) => importedSpecifiers(s).some((spec) => RADIX_PACKAGE.test(spec))),
  formPrimitiveImports: sources.filter((s) => importedSpecifiers(s).some((spec) => FORM_PRIMITIVE.test(spec))),
  primitiveStateClasses: sources.filter(
    (s) => s.kind === 'source' && PRIMITIVE_STATE_CLASS.test(s.content) && !OWN_DATA_STATE.includes(s.relativePath),
  ),
  fieldErrorOpacity: sources.filter(hasFieldErrorWithOpacity),
});

const paths = (sources: SourceFile[]) => sources.map((s) => s.relativePath);

describe('item sources stay base-agnostic', () => {
  const items = scanItems();
  const sources = items.flatMap(itemSourcePaths).map((absPath) => readSource(absPath, 'source'));
  const docs = itemAndBlockDocPaths(items).map((absPath) => readSource(absPath, 'doc'));
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

  test('no FieldError in a source or a doc snippet carries an opacity class', () => {
    expect(paths(violations.fieldErrorOpacity)).toEqual([]);
  });

  test.each(OWN_DATA_STATE)('%s still sets its own data-state', (relativePath) => {
    const own = sources.find((s) => s.relativePath === relativePath);
    expect(own?.content).toMatch(/\bdata-state=\{/);
  });
});

const asChildSites = (relativePath: string, content: string): string[] => {
  const file = parseTsx(relativePath, content);
  const sites: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isJsxAttribute(node) && node.name.getText(file) === 'asChild') {
      const tag = (node.parent.parent as ts.JsxOpeningLikeElement).tagName.getText(file);
      sites.push(`${relativePath} <${tag} asChild${node.initializer ? '={…}' : ''}>`);
    } else if (ts.isIdentifier(node) && node.text === 'asChild' && !ts.isJsxAttribute(node.parent)) {
      sites.push(`${relativePath} mentions asChild`);
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

  // No `asChild` survives in the Base UI output, whether used or declared. A site that does fails this test: give it
  // an override or a canonical form that composes on both bases, or list it here after checking that it composes.
  test('no asChild site is left in the published Base UI sources', () => {
    const consumerDir = path.join(outDir, 'consumer', 'items');
    const remaining = fs
      .readdirSync(consumerDir, { recursive: true, encoding: 'utf-8' })
      .filter((entry) => entry.endsWith('.tsx'))
      .flatMap((entry) => asChildSites(entry, fs.readFileSync(path.join(consumerDir, entry), 'utf-8')));
    expect(remaining.sort()).toEqual([]);
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

  test('flags data-[state= in a source, except those that set their own data-state', () => {
    const flagged = findViolations([
      source('packages/registry/items/blocks/a/component.radix.tsx', "cn('data-[state=open]:bg-accent')"),
      source('packages/registry/items/components/side-dialog/component.radix.tsx', "cn('data-[state=open]:x')"),
      source('packages/registry/items/components/side-dialog/default.example.radix.tsx', "cn('data-[state=open]:x')"),
    ]).primitiveStateClasses;
    expect(paths(flagged)).toEqual([
      'packages/registry/items/blocks/a/component.radix.tsx',
      'packages/registry/items/components/side-dialog/component.radix.tsx',
      'packages/registry/items/components/side-dialog/default.example.radix.tsx',
    ]);
  });

  test.each([
    ['a literal class', "<FieldError className='text-xs opacity-80' errors={[error]} />"],
    ['a double-quoted class', '<FieldError className="opacity-50" errors={[error]} />'],
    ['a variant class', "<FieldError className='text-xs hover:opacity-80' />"],
    ['an expression class', "<FieldError className={cn('text-xs', dim && 'opacity-80')} />"],
    ['a container element', "<FieldError className='opacity-80'>{message}</FieldError>"],
    ['a template literal class', `<FieldError className={\`text-xs \${tone} opacity-80\`} />`],
    [
      'a multi-line element',
      "<FieldError\n  id={errorId}\n  className='text-xs\n    opacity-80'\n  errors={[error]}\n/>",
    ],
  ])('flags a FieldError with %s', (_, content) => {
    expect(paths(findViolations([source('a.tsx', content)]).fieldErrorOpacity)).toEqual(['a.tsx']);
  });

  test('flags a FieldError with an opacity class in a fenced code block of a doc page, not in its prose', () => {
    const snippet = ['```tsx', "<FieldError className='opacity-80' errors={[error]} />", '```'].join('\n');
    const prose = "Do not put `<FieldError className='opacity-80' />` on the error.";
    expect(paths(findViolations([doc('a.mdx', snippet), doc('b.mdx', prose)]).fieldErrorOpacity)).toEqual(['a.mdx']);
  });

  test('does not flag a FieldError without opacity, nor opacity on other elements', () => {
    const flagged = findViolations([
      source('a.tsx', "<FieldError className='text-xs text-left' errors={[error]} />"),
      source('b.tsx', "<Check className='opacity-0' /><FieldError errors={[error]} />"),
      source('c.tsx', "<FieldError className='bg-opacity-half' />"),
    ]).fieldErrorOpacity;
    expect(flagged).toEqual([]);
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

const FORM_PROVIDER_TAG = /(?:^|\.)FormProvider$/;
const INLINE_EDIT_TAG = /(?:^|\.)InlineEditField$/;

/** The code blocks of a page, a block that embeds markdown (an `md` fence holding a skill) standing for its own blocks. */
const snippetsOf = (markdown: string): string[] =>
  [...markdown.matchAll(FENCED_CODE_BLOCK)].flatMap((m) => {
    const embedded = snippetsOf(m[2] as string);
    return embedded.length > 0 ? embedded : [m[2] as string];
  });

/** A field binds through its lens; only `InlineEditField` reads the form context, to validate on commit. */
const hasProviderWithoutInlineEdit = (file: SourceFile) =>
  (file.kind === 'doc' ? snippetsOf(file.content) : [file.content]).some((snippet) => {
    const tree = parseTsx(file.relativePath, snippet);
    const aliases = namedImports(tree, 'react-hook-form')
      .filter(({ imported }) => imported === 'FormProvider')
      .map(({ local }) => local);
    const providers = elementsMatching(tree, (tag) => FORM_PROVIDER_TAG.test(tag) || aliases.includes(tag));
    return providers.some(
      (provider) =>
        ts.isJsxSelfClosingElement(provider) ||
        elementsMatching(provider.parent, (tag) => INLINE_EDIT_TAG.test(tag)).length === 0,
    );
  });

describe('a FormProvider wraps an InlineEditField', () => {
  const items = scanItems();
  const examples = items.flatMap(itemExamplePaths).map((absPath) => readSource(absPath, 'source'));
  const docs = [...itemAndBlockDocPaths(items), ...guideDocPaths()].map((absPath) => readSource(absPath, 'doc'));

  test('scans the examples that keep the provider', () => {
    expect(paths(examples)).toContain('packages/registry/items/react-hook-form/inline-edit/default.example.radix.tsx');
  });

  test('scans the guides, the forms skill and the generated agent skills page', () => {
    expect(paths(docs)).toEqual(
      expect.arrayContaining([
        'apps/docs/content/components/react-hook-form/index.mdx',
        'packages/registry/skills/shuip-forms/SKILL.md',
        'apps/docs/content/docs/agent-skills.mdx',
      ]),
    );
  });

  test('no example renders a FormProvider around fields that bind through their lens', () => {
    expect(paths(examples.filter(hasProviderWithoutInlineEdit))).toEqual([]);
  });

  test('no doc snippet renders a FormProvider around fields that bind through their lens', () => {
    expect(paths(docs.filter(hasProviderWithoutInlineEdit))).toEqual([]);
  });

  describe('detection', () => {
    const source = (content: string): SourceFile => ({ relativePath: 'a.tsx', kind: 'source', content });
    const doc = (content: string): SourceFile => ({ relativePath: 'a.mdx', kind: 'doc', content });
    const provider = "import { FormProvider } from 'react-hook-form';";
    const inlineEdit = "<InlineEditField lens={lens.focus('name')} />";
    const inputField = "<InputField lens={lens.focus('name')} />";

    test.each([
      ['a named import', `${provider}\nexport const A = () => <FormProvider {...form}>${inputField}</FormProvider>;`],
      [
        'a namespace import',
        `import * as RHF from 'react-hook-form';\nexport const A = () => <RHF.FormProvider {...form}>${inputField}</RHF.FormProvider>;`,
      ],
      ['a render without an import', `export const A = () => <FormProvider {...form}>${inputField}</FormProvider>;`],
      [
        'an aliased import',
        `import { FormProvider as Provider } from 'react-hook-form';\nexport const A = () => <Provider {...form}>${inputField}</Provider>;`,
      ],
      [
        'an InlineEditField only in a comment',
        `${provider}\n// ${inlineEdit}\nexport const A = () => <FormProvider {...form}>{/* ${inlineEdit} */}${inputField}</FormProvider>;`,
      ],
      [
        'an InlineEditField only in a string',
        `${provider}\nexport const A = () => <FormProvider {...form}>{'${inlineEdit}'}${inputField}</FormProvider>;`,
      ],
      [
        'an InlineEditField only in an unused import',
        `${provider}\nimport { InlineEditField } from '@/components/ui/shuip/react-hook-form/inline-edit';\nexport const A = () => <FormProvider {...form}>${inputField}</FormProvider>;`,
      ],
      [
        'an unrelated InlineEditField next to the provider',
        `${provider}\nexport const A = () => <><FormProvider {...form}>${inputField}</FormProvider>${inlineEdit}</>;`,
      ],
      ['a self-closing provider', `${provider}\nexport const A = () => <FormProvider {...form} />;`],
    ])('flags %s', (_, content) => {
      expect(paths([source(content)].filter(hasProviderWithoutInlineEdit))).toEqual(['a.tsx']);
    });

    test.each([
      [
        'an InlineEditField inside the provider',
        `${provider}\nexport const A = () => <FormProvider {...form}><div>${inlineEdit}</div></FormProvider>;`,
      ],
      [
        'an InlineEditField inside an aliased provider',
        `import { FormProvider as Provider } from 'react-hook-form';\nexport const A = () => <Provider {...form}>${inlineEdit}</Provider>;`,
      ],
      ['no provider rendered', `${provider}\nexport const A = () => ${inputField};`],
    ])('accepts %s', (_, content) => {
      expect([source(content)].filter(hasProviderWithoutInlineEdit)).toEqual([]);
    });

    test('flags a doc whose provider is in another block than the InlineEditField', () => {
      const page = [
        '```tsx',
        `<FormProvider {...form}>${inputField}</FormProvider>`,
        '```',
        '',
        '```tsx',
        inlineEdit,
        '```',
      ];
      expect(paths([doc(page.join('\n'))].filter(hasProviderWithoutInlineEdit))).toEqual(['a.mdx']);
    });

    test('reads the blocks embedded in a markdown block, not its prose', () => {
      const prose = 'Wrap it in `<FormProvider {...form}>` for the inline field.';
      const embed = (block: string) => ['````md', prose, '```tsx', block, '```', '````'].join('\n');
      expect([doc(embed(inputField))].filter(hasProviderWithoutInlineEdit)).toEqual([]);
      expect(
        paths(
          [doc(embed(`<FormProvider {...form}>${inputField}</FormProvider>`))].filter(hasProviderWithoutInlineEdit),
        ),
      ).toEqual(['a.mdx']);
    });

    test('ignores a doc mention of the provider outside fenced code', () => {
      expect([doc('Wrap it in `<FormProvider {...form}>` when needed.')].filter(hasProviderWithoutInlineEdit)).toEqual(
        [],
      );
    });
  });
});

const REGISTRY_NAME = /^registryName:\s*['"]?([^'"\s]+)['"]?\s*$/m;

const declaredRegistryName = (doc: string) => doc.match(REGISTRY_NAME)?.[1];

const withoutCodeBlocks = (markdown: string) => markdown.replace(FENCED_CODE_BLOCK, '');

const rendersItemExamples = (doc: string, registryName: string) =>
  new RegExp(`<ItemExamples\\s+registryName=\\{?['"]${registryName}['"]\\}?\\s*/>`).test(withoutCodeBlocks(doc));

const docsMissingExamples = (docs: { relativePath: string; content: string; exampleCount: number }[]) =>
  docs.flatMap(({ relativePath, content, exampleCount }) => {
    const registryName = declaredRegistryName(content);
    return registryName && exampleCount > 1 && !rendersItemExamples(content, registryName) ? [relativePath] : [];
  });

describe('item doc pages render their examples', () => {
  const docs = scanItems()
    .filter((item) => item.hasMdx)
    .map((item) => {
      const doc = readSource(path.join(item.itemDir, 'index.mdx'), 'doc');
      return { ...doc, exampleCount: item.examples.length };
    });

  test('scans every item doc page that declares a registry name', () => {
    expect(docs.filter((doc) => declaredRegistryName(doc.content)).length).toBeGreaterThan(0);
    expect(docs.some((doc) => declaredRegistryName(doc.content) && doc.exampleCount > 1)).toBe(true);
  });

  test('every doc page of an item with more than its default example renders ItemExamples', () => {
    expect(docsMissingExamples(docs)).toEqual([]);
  });

  describe('detection', () => {
    const page = (body: string) => `---\ntitle: T\nregistryName: tsq-x\n---\n\n${body}\n`;
    const check = (content: string, exampleCount = 2) =>
      docsMissingExamples([{ relativePath: 'a.mdx', content, exampleCount }]);

    test('flags a page without the block', () => {
      expect(check(page('## Props'))).toEqual(['a.mdx']);
    });

    test('flags a page that only shows the block inside a code snippet', () => {
      const snippet = ['```mdx', "<ItemExamples registryName={'tsq-x'} />", '```'].join('\n');
      expect(check(page(snippet))).toEqual(['a.mdx']);
    });

    test('flags a page whose block names another item', () => {
      expect(check(page("<ItemExamples registryName={'tsq-y'} />"))).toEqual(['a.mdx']);
    });

    test.each([
      ['braced single quotes', "<ItemExamples registryName={'tsq-x'} />"],
      ['plain single quotes', "<ItemExamples registryName='tsq-x' />"],
      ['plain double quotes', '<ItemExamples registryName="tsq-x"/>'],
    ])('accepts %s', (_, body) => {
      expect(check(page(body))).toEqual([]);
    });

    test('accepts a page whose item has only its default example', () => {
      expect(check(page('## Props'), 1)).toEqual([]);
    });

    test('ignores a page that declares no registry name', () => {
      expect(check('## Props', 3)).toEqual([]);
    });
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
