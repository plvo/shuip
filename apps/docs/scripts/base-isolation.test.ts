import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(import.meta.dir, '..', 'src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');

const BASE_UI_ONLY = /^@repo\/registry\/__index__\.base$|^@\/components\/ui-base\//;
const RADIX_ONLY = /^@repo\/registry\/__index__$|^@\/components\/ui\//;

const specifiersOf = (file: string): string[] =>
  [...fs.readFileSync(file, 'utf-8').matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)].map(
    (match) => match[1] as string,
  );

const withExtension = (base: string): string | undefined =>
  ['', '.tsx', '.ts', '/index.tsx', '/index.ts']
    .map((suffix) => `${base}${suffix}`)
    .find((file) => fs.existsSync(file) && fs.statSync(file).isFile());

// The primitives are the leaves the rules look for; every other module of the docs is followed.
const localTarget = (from: string, specifier: string): string | undefined => {
  if (BASE_UI_ONLY.test(specifier) || RADIX_ONLY.test(specifier)) return undefined;
  if (specifier.startsWith('.')) return withExtension(path.resolve(path.dirname(from), specifier));
  if (specifier.startsWith('@/')) return withExtension(path.join(SRC_DIR, specifier.slice(2)));
  return undefined;
};

/** Every module the entry reaches through imports of the docs, with the external specifiers it imports. */
const reach = (entry: string): { files: string[]; specifiers: string[] } => {
  const files = new Set<string>();
  const specifiers = new Set<string>();
  const queue = [entry];
  for (let file = queue.pop(); file; file = queue.pop()) {
    if (files.has(file)) continue;
    files.add(file);
    for (const specifier of specifiersOf(file)) {
      specifiers.add(specifier);
      const target = localTarget(file, specifier);
      if (target) queue.push(target);
    }
  }
  return { files: [...files], specifiers: [...specifiers] };
};

const modulesIn = (folder: string): string[] =>
  fs
    .readdirSync(path.join(COMPONENTS_DIR, folder))
    .filter((file) => file.endsWith('.tsx') && !file.includes('.test.'))
    .map((file) => path.join(COMPONENTS_DIR, folder, file));

// Each base owns the client modules that touch its primitives, so a page loads one library only.
const PER_BASE = [
  { base: 'Base UI', prefix: 'base-ui-', own: BASE_UI_ONLY, other: RADIX_ONLY },
  { base: 'Radix', prefix: 'radix-', own: RADIX_ONLY, other: BASE_UI_ONLY },
];

describe.each(PER_BASE)('the $base modules', ({ prefix, own, other }) => {
  const entries = ['preview', 'providers'].flatMap(modulesIn).filter((file) => path.basename(file).startsWith(prefix));

  test('exist for the previews and the providers', () => {
    expect(entries.map((file) => path.basename(path.dirname(file))).sort()).toEqual(['preview', 'providers']);
  });

  test.each(entries)('%s reaches the primitives of its own base and none of the other', (entry) => {
    const { specifiers } = reach(entry);

    expect(specifiers.some((specifier) => own.test(specifier))).toBe(true);
    expect(specifiers.filter((specifier) => other.test(specifier))).toEqual([]);
  });

  test.each(entries)('%s is a client module', (entry) => {
    expect(fs.readFileSync(entry, 'utf-8').startsWith("'use client'")).toBe(true);
  });
});

describe('the modules shared by both bases', () => {
  const shared = ['preview', 'providers']
    .flatMap(modulesIn)
    .filter((file) => !/^(base-ui|radix)-/.test(path.basename(file)))
    .filter((file) => !['preview.tsx', 'providers-for-base.tsx'].includes(path.basename(file)));

  test('are found', () => {
    expect(shared.map((file) => path.basename(file))).toContain('preview-frame.tsx');
  });

  test.each(shared)('%s reaches the primitives of neither base', (file) => {
    const { specifiers } = reach(file);

    expect(specifiers.filter((specifier) => BASE_UI_ONLY.test(specifier) || RADIX_ONLY.test(specifier))).toEqual([]);
  });
});

describe('the modules that choose a base', () => {
  test.each([
    'preview/preview.tsx',
    'providers/providers-for-base.tsx',
  ])('%s imports the primitives only through the per-base modules', (file) => {
    const specifiers = specifiersOf(path.join(COMPONENTS_DIR, file));

    expect(specifiers.filter((specifier) => BASE_UI_ONLY.test(specifier) || RADIX_ONLY.test(specifier))).toEqual([]);
  });
});
