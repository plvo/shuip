#!/usr/bin/env bun
/** biome-ignore-all lint/suspicious/noAssignInExpressions: script */
import fs from 'node:fs';
import path from 'node:path';
import { buildRegistryDependencies, type Catalog, flattenCatalogs, pinDependencies } from './dependencies';
import { applySkillSourcesToDocs, assertUniqueNames, emitSkills, resolveCatalog } from './skills';

const ROOT = path.resolve(import.meta.dir, '..');
const ROOT_PACKAGE_JSON = path.resolve(ROOT, '../../package.json');
const ITEMS_DIR = path.join(ROOT, 'items');
const STUBS_DIR = path.join(ROOT, 'stubs');
const COMPONENTS_CONTENT_DIR = path.resolve(ROOT, '../../apps/docs/content/components');
const SKILLS_DIR = path.join(ROOT, 'skills');
const SKILLS_GENERATED_DIR = path.join(SKILLS_DIR, '.generated');
const AGENT_SKILLS_DOC = path.resolve(ROOT, '../../apps/docs/content/docs/agent-skills.mdx');

export interface RegistryFile {
  path: string;
  type: 'registry:ui' | 'registry:block' | 'registry:lib' | 'registry:file';
  target?: string;
}

export interface RegistryItem {
  name: string;
  type: 'registry:ui' | 'registry:block' | 'registry:lib' | 'registry:item';
  dependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryFile[];
}

const CANONICAL_BASE = 'radix';
const COMPONENT_BASENAME = `component.${CANONICAL_BASE}`;
const COMPONENT_FILENAME = `${COMPONENT_BASENAME}.tsx`;
const UNSUFFIXED_COMPONENT_FILENAME = 'component.tsx';
const RECOGNISED_EXAMPLE_BASES: readonly string[] = [CANONICAL_BASE];
const EXAMPLE_FILE_PATTERN = /^(.+)\.example(?:\.([^.]+))?\.tsx$/;

interface ItemMeta {
  dependsOn?: string[];
}

interface CategoryConfig {
  itemType: 'registry:ui' | 'registry:block' | 'registry:lib';
  targetPath: string;
  prefix?: string;
}

const CATEGORIES = {
  components: { itemType: 'registry:ui', targetPath: './components/ui/shuip' },
  'react-hook-form': {
    itemType: 'registry:ui',
    targetPath: './components/ui/shuip/react-hook-form',
    prefix: 'rhf',
  },
  'tanstack-form': {
    itemType: 'registry:ui',
    targetPath: './components/ui/shuip/tanstack-form',
    prefix: 'tsf',
  },
  'tanstack-query': {
    itemType: 'registry:ui',
    targetPath: './components/ui/shuip/tanstack-query',
    prefix: 'tsq',
  },
  blocks: { itemType: 'registry:block', targetPath: './components/block/shuip' },
  lib: { itemType: 'registry:lib', targetPath: './lib' },
} as const satisfies Record<string, CategoryConfig>;

type Category = keyof typeof CATEGORIES;

const isCategory = (cat: string): cat is Category => cat in CATEGORIES;

const categoryToType = (cat: Category): 'registry:ui' | 'registry:block' | 'registry:lib' => CATEGORIES[cat].itemType;

const namePrefix = (cat: Category, name: string): string => {
  const { prefix } = CATEGORIES[cat];
  return prefix ? `${prefix}-${name}` : name;
};

const computeTarget = (cat: Category, name: string): string => {
  const ext = cat === 'lib' ? 'ts' : 'tsx';
  return `${CATEGORIES[cat].targetPath}/${name}.${ext}`;
};

export const computeStubPath = (cat: Category, name: string): string =>
  cat === 'components' ? path.join(STUBS_DIR, `${name}.tsx`) : path.join(STUBS_DIR, cat, `${name}.tsx`);

const stubExportPath = (cat: Category, name: string): string => {
  const prefix = cat === 'components' ? '../' : '../../';
  return `${prefix}items/${cat}/${name}/${COMPONENT_BASENAME}`;
};

// Parse TS imports from a source file. Returns named npm packages (and their submodules)
// excluding @/* and @repo/* and relative imports.
const parseImports = (source: string): string[] => {
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(source)) !== null) {
    const spec = m[1];
    if (!spec) continue;
    if (spec.startsWith('.') || spec.startsWith('@/') || spec.startsWith('@repo/') || spec.startsWith('#/')) continue;
    const parts = spec.split('/');
    if (spec.startsWith('@')) {
      out.add(parts.slice(0, 2).join('/'));
    } else {
      out.add(parts[0]);
    }
  }
  return Array.from(out).sort();
};

// Parse @/components/ui/<name> imports → registryDependencies (shadcn primitives).
const parseRegistryDeps = (source: string): string[] => {
  const regex = /from\s+['"]@\/components\/ui\/([^'"/]+)['"]/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(source)) !== null) {
    if (m[1] && m[1] !== 'shuip') out.add(m[1]);
  }
  return Array.from(out).sort();
};

// Parse @/components/ui/shuip/<...> imports → registryDependencies (shuip-internal items).
// One segment (e.g. `side-dialog`) resolves to a `components`-category item.
// Two segments (e.g. `tanstack-form/form-context`) resolve to a prefixed item (`tsf-form-context`).
const parseShuipDeps = (source: string): string[] => {
  const regex = /from\s+['"]@\/components\/ui\/shuip\/([^'"]+)['"]/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(source)) !== null) {
    const parts = m[1]?.split('/') ?? [];
    if (parts.length === 1 && parts[0]) {
      out.add(parts[0]);
    } else if (parts.length === 2) {
      const [cat, name] = parts;
      if (cat && name && isCategory(cat)) out.add(namePrefix(cat, name));
    }
  }
  return Array.from(out).sort();
};

// Parse @/lib/<name> imports → registryDependencies (shuip-internal lib items).
// Excludes `utils`, which shadcn provides via `npx shadcn init`.
const parseLibDeps = (source: string): string[] => {
  const regex = /from\s+['"]@\/lib\/([^'"/]+)['"]/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(source)) !== null) {
    if (m[1] && m[1] !== 'utils') out.add(m[1]);
  }
  return Array.from(out).sort();
};

const readMeta = (itemDir: string): ItemMeta => {
  const metaPath = path.join(itemDir, 'meta.shuip.json');
  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }
  return {};
};

interface ExampleFile {
  filename: string;
  variant: string;
  base: string | undefined;
}

type ScannedExample = Pick<ExampleFile, 'filename' | 'variant'> & { absPath: string };

export interface ScannedItem {
  category: Category;
  folderName: string;
  itemDir: string;
  componentPath: string;
  examples: ScannedExample[];
  extras: { filename: string; absPath: string }[];
  hasMdx: boolean;
}

const parseExampleFile = (filename: string): ExampleFile | null => {
  const match = filename.match(EXAMPLE_FILE_PATTERN);
  return match ? { filename, variant: match[1] as string, base: match[2] } : null;
};

const hasRecognisedBase = (example: ExampleFile): example is ExampleFile & { base: string } =>
  example.base !== undefined && RECOGNISED_EXAMPLE_BASES.includes(example.base);

const listExampleFiles = (itemDir: string): ExampleFile[] =>
  fs.readdirSync(itemDir).flatMap((f) => parseExampleFile(f) ?? []);

export const scanItems = (itemsDir: string = ITEMS_DIR): ScannedItem[] => {
  const out: ScannedItem[] = [];
  const problems: string[] = [];
  const dirs = fs.existsSync(itemsDir)
    ? fs.readdirSync(itemsDir).filter((d) => fs.statSync(path.join(itemsDir, d)).isDirectory())
    : [];

  for (const category of dirs) {
    if (!isCategory(category)) {
      console.warn(`[generate] skipping unknown category "${category}" — add it to CATEGORIES in generate.ts`);
      continue;
    }
    const catDir = path.join(itemsDir, category);
    const entries = fs.readdirSync(catDir).filter((d) => {
      const p = path.join(catDir, d);
      return fs.statSync(p).isDirectory();
    });

    for (const folderName of entries) {
      const itemDir = path.join(catDir, folderName);
      const mainFile = category === 'lib' ? `${folderName}.ts` : COMPONENT_FILENAME;
      const componentPath = path.join(itemDir, mainFile);
      if (category !== 'lib' && fs.existsSync(path.join(itemDir, UNSUFFIXED_COMPONENT_FILENAME))) {
        problems.push(
          `${category}/${folderName}: ${UNSUFFIXED_COMPONENT_FILENAME} must be renamed to ${COMPONENT_FILENAME}`,
        );
        continue;
      }
      const exampleFiles = listExampleFiles(itemDir);
      for (const { filename } of exampleFiles.filter((e) => !hasRecognisedBase(e))) {
        problems.push(
          `${category}/${folderName}: ${filename} has no recognised base suffix (${RECOGNISED_EXAMPLE_BASES.join(', ')})`,
        );
      }
      if (!fs.existsSync(componentPath)) {
        console.warn(`[generate] skipping ${category}/${folderName}: no ${mainFile}`);
        continue;
      }
      const examples = exampleFiles
        .filter(hasRecognisedBase)
        .map(({ filename, variant }) => ({ filename, absPath: path.join(itemDir, filename), variant }));
      const extrasDir = path.join(itemDir, 'extras');
      const extras = fs.existsSync(extrasDir)
        ? fs.readdirSync(extrasDir).map((filename) => ({ filename, absPath: path.join(extrasDir, filename) }))
        : [];
      const hasMdx = fs.existsSync(path.join(itemDir, 'index.mdx'));
      out.push({ category, folderName, itemDir, componentPath, examples, extras, hasMdx });
    }
  }
  if (problems.length > 0) {
    throw new Error(`[generate] invalid item files:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }
  if (out.length === 0) {
    throw new Error(`[generate] no items found in ${itemsDir}`);
  }
  return out;
};

const readRootCatalog = (): Catalog => flattenCatalogs(JSON.parse(fs.readFileSync(ROOT_PACKAGE_JSON, 'utf-8')));

const buildRegistryJson = (
  items: ScannedItem[],
  catalog: Catalog,
): { name: string; homepage: string; items: RegistryItem[] } => {
  const out: RegistryItem[] = [];
  for (const item of items) {
    const { category, folderName, componentPath, extras } = item;
    const source = fs.readFileSync(componentPath, 'utf-8');
    const itemName = namePrefix(category, folderName);
    const dependencies = pinDependencies(parseImports(source), catalog, itemName);
    const meta = readMeta(item.itemDir);
    const fullDeps = buildRegistryDependencies({
      primitives: parseRegistryDeps(source),
      shuipItems: [...parseShuipDeps(source), ...parseLibDeps(source), ...(meta.dependsOn ?? [])],
    });
    const target = computeTarget(category, folderName);
    const componentRelPath = path.relative(ROOT, componentPath).replace(/\\/g, '/');
    const files: RegistryFile[] = [
      {
        path: `./${componentRelPath}`,
        type: categoryToType(category),
        target,
      },
    ];
    for (const extra of extras) {
      const extraRel = path.relative(ROOT, extra.absPath).replace(/\\/g, '/');
      let extraTarget: string;
      if (extra.filename.endsWith('.action.ts')) {
        const base = extra.filename.replace(/\.action\.ts$/, '');
        extraTarget = `./actions/shuip/${base}.ts`;
      } else {
        extraTarget = `./components/ui/shuip/${extra.filename}`;
      }
      files.push({ path: `./${extraRel}`, type: 'registry:file', target: extraTarget });
    }
    const entry: RegistryItem = {
      name: itemName,
      type: categoryToType(category),
      files,
    };
    if (dependencies.length) entry.dependencies = dependencies;
    if (fullDeps.length) entry.registryDependencies = fullDeps;
    out.push(entry);
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return { name: 'shuip', homepage: 'https://shuip.plvo.dev', items: out };
};

export const buildIndexTs = (items: ScannedItem[]): string => {
  let body = `// @ts-nocheck

/**
 * AUTO-GENERATED by packages/registry/scripts/generate.ts. Do not edit.
 */

import * as React from 'react';

interface RegistryComponent {
  path: string;
  code: string;
  component: any;
}

export const REGISTRY_INDEX: Record<string, RegistryComponent> = {`;

  for (const item of items) {
    if (item.category === 'lib') continue;
    const { category, folderName, componentPath, examples } = item;
    const itemName = namePrefix(category, folderName);
    const importPath = `@repo/registry/items/${category}/${folderName}/${COMPONENT_BASENAME}`;
    const code = fs.readFileSync(componentPath, 'utf-8');
    body += `
  '${itemName}': {
    path: '${importPath}',
    code: ${JSON.stringify(code)},
    component: React.lazy(() => import('${importPath}')),
  },`;
    for (const ex of examples) {
      const exImport = `@repo/registry/items/${category}/${folderName}/${ex.filename.replace(/\.tsx$/, '')}`;
      const exCode = fs.readFileSync(ex.absPath, 'utf-8');
      const exKey = ex.variant === 'default' ? `${itemName}.example` : `${itemName}.${ex.variant}.example`;
      body += `
  '${exKey}': {
    path: '${exImport}',
    code: ${JSON.stringify(exCode)},
    component: React.lazy(() => import('${exImport}')),
  },`;
    }
  }

  body += `
};
`;
  return body;
};

export const buildStubContent = (
  cat: Category,
  name: string,
): string => `// AUTO-GENERATED by packages/registry/scripts/generate.ts — DO NOT EDIT
export * from '${stubExportPath(cat, name)}';
`;

const writeStubs = (items: ScannedItem[]): void => {
  fs.rmSync(STUBS_DIR, { recursive: true, force: true });
  for (const item of items) {
    if (item.category === 'lib') continue;
    const stubPath = computeStubPath(item.category, item.folderName);
    fs.mkdirSync(path.dirname(stubPath), { recursive: true });
    fs.writeFileSync(stubPath, buildStubContent(item.category, item.folderName));
  }
};

// UI `components` items render flat under /components/<name>; other categories keep a subfolder.
const componentsDocsDir = (category: string): string =>
  category === 'components' ? COMPONENTS_CONTENT_DIR : path.join(COMPONENTS_CONTENT_DIR, category);

const writeComponentSymlinks = (items: ScannedItem[]): void => {
  const symlinksByCategory = new Map<string, string[]>();

  for (const item of items) {
    if (!item.hasMdx) continue;
    const symlinkPath = path.join(componentsDocsDir(item.category), `${item.folderName}.mdx`);
    const sourceMdx = path.join(item.itemDir, 'index.mdx');
    const relTarget = path.relative(path.dirname(symlinkPath), sourceMdx);
    fs.mkdirSync(path.dirname(symlinkPath), { recursive: true });
    try {
      fs.unlinkSync(symlinkPath);
    } catch {
      // file did not exist
    }
    fs.symlinkSync(relTarget, symlinkPath);

    const existing = symlinksByCategory.get(item.category) ?? [];
    existing.push(`${item.folderName}.mdx`);
    symlinksByCategory.set(item.category, existing);
  }

  for (const [category, filenames] of symlinksByCategory) {
    const gitignorePath = path.join(componentsDocsDir(category), '.gitignore');
    const content = `# Auto-generated symlinks — do not commit (created by packages/registry/scripts/generate.ts)\n${filenames.sort().join('\n')}\n`;
    fs.writeFileSync(gitignorePath, content);
  }
};

const main = () => {
  const items = scanItems();
  const registry = buildRegistryJson(items, readRootCatalog());

  const catalogItems = items.map((i) => ({
    category: i.category,
    publishedName: namePrefix(i.category, i.folderName),
  }));
  const { items: skillItems, sources: skillSources } = emitSkills({
    skillsDir: SKILLS_DIR,
    generatedDir: SKILLS_GENERATED_DIR,
    registryRoot: ROOT,
    catalog: resolveCatalog(catalogItems),
    bundleName: 'shuip-skills',
  });
  assertUniqueNames(
    registry.items.map((i) => i.name),
    skillItems.map((i) => i.name),
  );
  registry.items.push(...skillItems);
  registry.items.sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(path.join(ROOT, 'registry.json'), `${JSON.stringify(registry, null, 2)}\n`);
  fs.writeFileSync(path.join(ROOT, '__index__.ts'), buildIndexTs(items));
  writeStubs(items);
  writeComponentSymlinks(items);

  if (fs.existsSync(AGENT_SKILLS_DOC)) {
    const docs = fs.readFileSync(AGENT_SKILLS_DOC, 'utf-8');
    const rewritten = applySkillSourcesToDocs(docs, skillSources);
    if (rewritten !== docs) fs.writeFileSync(AGENT_SKILLS_DOC, rewritten);
  }

  console.log(`[generate] ${items.length} items + ${skillItems.length} skill items processed`);
};

if (import.meta.main) main();
