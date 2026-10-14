import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

const COMPONENTS_DIR = path.resolve(import.meta.dir, '..', 'src', 'components');

const importedSpecifiers = (file: string): string[] =>
  [...fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf-8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map(
    (match) => match[1] as string,
  );

// Each base owns the client modules that touch its primitives, so a page loads one library only.
const BASE_UI_ONLY = /^@repo\/registry\/__index__\.base$|^@\/components\/ui-base\//;
const RADIX_ONLY = /^@repo\/registry\/__index__$|^@\/components\/ui\//;

const PER_BASE_MODULES = [
  {
    base: 'Base UI',
    files: ['preview/base-ui-preview.tsx', 'providers/base-ui-providers.tsx'],
    own: BASE_UI_ONLY,
    other: RADIX_ONLY,
  },
  {
    base: 'Radix',
    files: ['preview/radix-preview.tsx', 'providers/radix-providers.tsx'],
    own: RADIX_ONLY,
    other: BASE_UI_ONLY,
  },
];

describe.each(PER_BASE_MODULES)('the $base modules', ({ files, own, other }) => {
  test.each(files)('%s imports the primitives of its own base and nothing of the other', (file) => {
    const specifiers = importedSpecifiers(file);

    expect(specifiers.some((specifier) => own.test(specifier))).toBe(true);
    expect(specifiers.filter((specifier) => other.test(specifier))).toEqual([]);
  });

  test.each(files)('%s is a client module', (file) => {
    expect(fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf-8').startsWith("'use client'")).toBe(true);
  });
});

describe('the modules that choose a base', () => {
  test.each([
    'preview/preview.tsx',
    'providers/providers-for-base.tsx',
  ])('%s reaches the primitives only through the per-base modules', (file) => {
    const specifiers = importedSpecifiers(file);

    expect(specifiers.filter((specifier) => BASE_UI_ONLY.test(specifier) || RADIX_ONLY.test(specifier))).toEqual([]);
  });
});
