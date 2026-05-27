#!/usr/bin/env bun
/** biome-ignore-all lint/suspicious/noAssignInExpressions: script */
import fs from 'node:fs';
import path from 'node:path';
import { assertUniqueNames, emitSkills, resolveCatalog } from './skills';

const ROOT = path.resolve(import.meta.dir, '..');
const ITEMS_DIR = path.join(ROOT, 'items');
const STUBS_DIR = path.join(ROOT, 'stubs');
const COMPONENTS_CONTENT_DIR = path.resolve(ROOT, '../../apps/docs/content/components');
const SKILLS_DIR = path.join(ROOT, 'skills');
const SKILLS_GENERATED_DIR = path.join(SKILLS_DIR, '.generated');

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

const computeStubPath = (cat: Category, name: string): string =>
  cat === 'components' ? path.join(STUBS_DIR, `${name}.tsx`) : path.join(STUBS_DIR, cat, `${name}.tsx`);

const stubExportPath = (cat: Category, name: string): string => {
  const prefix = cat === 'components' ? '../' : '../../';
  return `${prefix}items/${cat}/${name}/component`;
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

interface ScannedItem {
  category: Category;
  folderName: string;
  itemDir: string;
  componentPath: string;
  examples: { filename: string; absPath: string }[];
  extras: { filename: string; absPath: string }[];
  hasMdx: boolean;
}

const scanItems = (): ScannedItem[] => {
  const out: ScannedItem[] = [];
  if (!fs.existsSync(ITEMS_DIR)) return out;
  const dirs = fs.readdirSync(ITEMS_DIR).filter((d) => fs.statSync(path.join(ITEMS_DIR, d)).isDirectory());

  for (const category of dirs) {
    if (!isCategory(category)) {
      console.warn(`[generate] skipping unknown category "${category}" — add it to CATEGORIES in generate.ts`);
      continue;
    }
    const catDir = path.join(ITEMS_DIR, category);
    const entries = fs.readdirSync(catDir).filter((d) => {
      const p = path.join(catDir, d);
      return fs.statSync(p).isDirectory();
    });

    for (const folderName of entries) {
      const itemDir = path.join(catDir, folderName);
      const mainFile = category === 'lib' ? `${folderName}.ts` : 'component.tsx';
      const componentPath = path.join(itemDir, mainFile);
      if (!fs.existsSync(componentPath)) {
        console.warn(`[generate] skipping ${category}/${folderName}: no ${mainFile}`);
        continue;
      }
      const examples = fs
        .readdirSync(itemDir)
        .filter((f) => f.endsWith('.example.tsx'))
        .map((filename) => ({ filename, absPath: path.join(itemDir, filename) }));
      const extrasDir = path.join(itemDir, 'extras');
      const extras = fs.existsSync(extrasDir)
        ? fs.readdirSync(extrasDir).map((filename) => ({ filename, absPath: path.join(extrasDir, filename) }))
        : [];
      const hasMdx = fs.existsSync(path.join(itemDir, 'index.mdx'));
      out.push({ category, folderName, itemDir, componentPath, examples, extras, hasMdx });
    }
  }
  return out;
};

const buildRegistryJson = (items: ScannedItem[]): { name: string; homepage: string; items: RegistryItem[] } => {
  const out: RegistryItem[] = [];
  for (const item of items) {
    const { category, folderName, componentPath, extras } = item;
    const source = fs.readFileSync(componentPath, 'utf-8');
    const dependencies = parseImports(source);
    const registryDependencies = parseRegistryDeps(source);
    const shuipDeps = parseShuipDeps(source);
    const libDeps = parseLibDeps(source);
    const meta = readMeta(item.itemDir);
    const fullDeps = Array.from(
      new Set([...registryDependencies, ...shuipDeps, ...libDeps, ...(meta.dependsOn ?? [])]),
    ).sort();
    const itemName = namePrefix(category, folderName);
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

const buildIndexTs = (items: ScannedItem[]): string => {
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
    const importPath = `@repo/registry/items/${category}/${folderName}/component`;
    const code = fs.readFileSync(componentPath, 'utf-8');
    body += `
  '${itemName}': {
    path: '${importPath}',
    code: ${JSON.stringify(code)},
    component: React.lazy(() => import('${importPath}')),
  },`;
    for (const ex of examples) {
      const variant = ex.filename.replace(/\.example\.tsx$/, '');
      const exImport = `@repo/registry/items/${category}/${folderName}/${variant}.example`;
      const exCode = fs.readFileSync(ex.absPath, 'utf-8');
      const exKey = variant === 'default' ? `${itemName}.example` : `${itemName}.${variant}.example`;
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

const writeStubs = (items: ScannedItem[]): void => {
  fs.rmSync(STUBS_DIR, { recursive: true, force: true });
  for (const item of items) {
    if (item.category === 'lib') continue;
    const stubPath = computeStubPath(item.category, item.folderName);
    fs.mkdirSync(path.dirname(stubPath), { recursive: true });
    const exportPath = stubExportPath(item.category, item.folderName);
    const content = `// AUTO-GENERATED by packages/registry/scripts/generate.ts — DO NOT EDIT
export * from '${exportPath}';
`;
    fs.writeFileSync(stubPath, content);
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
  const registry = buildRegistryJson(items);

  const catalogItems = items.map((i) => ({
    category: i.category,
    publishedName: namePrefix(i.category, i.folderName),
  }));
  const skillItems = emitSkills({
    skillsDir: SKILLS_DIR,
    generatedDir: SKILLS_GENERATED_DIR,
    registryRoot: ROOT,
    catalog: resolveCatalog(catalogItems),
    registryBaseUrl: 'https://shuip.plvo.dev/r',
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
  console.log(`[generate] ${items.length} items + ${skillItems.length} skill items processed`);
};

main();
