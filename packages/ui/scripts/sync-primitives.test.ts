import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  applyPlan,
  assertDeclared,
  buildComponentsConfig,
  declaredFiles,
  diffDeclared,
  mirrorInstalledFiles,
  PRIMITIVES,
  planSet,
  SETS,
} from './sync-primitives';

const baseConfig = {
  $schema: 'https://ui.shadcn.com/schema.json',
  style: 'radix-vega',
  rsc: true,
  tailwind: { css: 'src/styles/base.css', baseColor: 'neutral' },
  aliases: { components: '@repo/ui/components', ui: '@repo/ui/components/ui' },
  iconLibrary: 'lucide',
};

const setFor = (style: string) => {
  const set = SETS.find((candidate) => candidate.style === style);
  if (!set) throw new Error(`no set for ${style}`);
  return set;
};

describe('buildComponentsConfig', () => {
  test('radix-vega installs into the ui folder', () => {
    const config = buildComponentsConfig(baseConfig, setFor('radix-vega'));
    expect(config.style).toBe('radix-vega');
    expect(config.aliases.ui).toBe('@/components/ui');
    expect(config.aliases).toMatchObject({
      components: '@/components',
      utils: '@/lib/utils',
      lib: '@/lib',
      hooks: '@/hooks',
    });
  });

  test('base-vega installs into the ui-base folder so siblings import from the same set', () => {
    const config = buildComponentsConfig(baseConfig, setFor('base-vega'));
    expect(config.style).toBe('base-vega');
    expect(config.aliases.ui).toBe('@/components/ui-base');
    expect(config.aliases).toMatchObject({
      components: '@/components',
      utils: '@/lib/utils',
      lib: '@/lib',
      hooks: '@/hooks',
    });
  });

  test('keeps every other setting of the UI package config', () => {
    const config = buildComponentsConfig(baseConfig, setFor('base-vega'));
    expect(config.rsc).toBe(true);
    expect(config.iconLibrary).toBe('lucide');
    expect(config.tailwind).toEqual(baseConfig.tailwind);
  });
});

describe('diffDeclared', () => {
  const expected = declaredFiles(['button', 'label']);

  test('passes when the installed files are exactly the declared ones', () => {
    expect(diffDeclared(['label.tsx', 'button.tsx'], expected)).toEqual({ missing: [], undeclared: [] });
  });

  test('reports an installed file that is not declared', () => {
    expect(diffDeclared(['button.tsx', 'label.tsx', 'separator.tsx'], expected).undeclared).toEqual(['separator.tsx']);
  });

  test('reports a declared file that was not installed', () => {
    expect(diffDeclared(['button.tsx'], expected).missing).toEqual(['label.tsx']);
  });

  test('assertDeclared throws and names the undeclared file', () => {
    expect(() => assertDeclared('radix-vega', ['button.tsx', 'label.tsx', 'separator.tsx'], expected)).toThrow(
      /separator\.tsx/,
    );
  });

  test('assertDeclared accepts a complete install', () => {
    expect(() => assertDeclared('radix-vega', ['button.tsx', 'label.tsx'], expected)).not.toThrow();
  });

  test('declares each primitive once', () => {
    expect(new Set(PRIMITIVES).size).toBe(PRIMITIVES.length);
  });
});

describe('mirrorInstalledFiles', () => {
  let workDir: string;
  let installedDir: string;
  let target: string;

  const write = (dir: string, file: string, content: string) => fs.writeFile(path.join(dir, file), content);
  const read = (dir: string, file: string) => fs.readFile(path.join(dir, file), 'utf-8');
  const exists = (dir: string, file: string) =>
    fs.access(path.join(dir, file)).then(
      () => true,
      () => false,
    );

  beforeEach(async () => {
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sync-primitives-test-'));
    installedDir = path.join(workDir, 'installed');
    target = path.join(workDir, 'target');
    await fs.mkdir(installedDir);
    await fs.mkdir(target);
    await write(installedDir, 'button.tsx', 'button');
    await write(installedDir, 'label.tsx', 'label');
  });

  afterEach(() => fs.rm(workDir, { recursive: true, force: true }));

  test('writes every installed file into an empty target', async () => {
    expect(await mirrorInstalledFiles(installedDir, target)).toEqual({ written: 2, removed: 0 });
    expect(await read(target, 'button.tsx')).toBe('button');
  });

  test('a second run on an up-to-date target writes and removes nothing', async () => {
    await mirrorInstalledFiles(installedDir, target);
    expect(await mirrorInstalledFiles(installedDir, target)).toEqual({ written: 0, removed: 0 });
  });

  test('overwrites a file whose content changed', async () => {
    await mirrorInstalledFiles(installedDir, target);
    await write(installedDir, 'button.tsx', 'button v2');
    expect(await mirrorInstalledFiles(installedDir, target)).toEqual({ written: 1, removed: 0 });
    expect(await read(target, 'button.tsx')).toBe('button v2');
  });

  test('removes an orphan that is no longer installed', async () => {
    await write(target, 'orphan.tsx', 'orphan');
    expect(await mirrorInstalledFiles(installedDir, target)).toEqual({ written: 2, removed: 1 });
    expect(await exists(target, 'orphan.tsx')).toBe(false);
  });

  test('mirrors a nested file into a missing subfolder', async () => {
    await fs.mkdir(path.join(installedDir, 'nested'));
    await write(installedDir, path.join('nested', 'deep.tsx'), 'deep');
    expect(await mirrorInstalledFiles(installedDir, target)).toEqual({ written: 3, removed: 0 });
    expect(await read(target, path.join('nested', 'deep.tsx'))).toBe('deep');
  });
});

describe('planSet', () => {
  test('radix-vega mirrors into ui', () => {
    expect(planSet(setFor('radix-vega'), '/components').target).toBe('/components/ui');
  });

  test('base-vega mirrors into ui-base', () => {
    expect(planSet(setFor('base-vega'), '/components').target).toBe('/components/ui-base');
  });

  test('both sets declare the same primitives', () => {
    expect(planSet(setFor('base-vega')).declared).toEqual(declaredFiles(PRIMITIVES));
    expect(planSet(setFor('radix-vega')).declared).toEqual(declaredFiles(PRIMITIVES));
  });
});

describe('applyPlan', () => {
  let workDir: string;
  let installedDir: string;

  const populate = (dir: string, files: string[]) =>
    Promise.all(files.map((file) => fs.writeFile(path.join(dir, file), file)));

  beforeEach(async () => {
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sync-primitives-plan-'));
    installedDir = path.join(workDir, 'installed');
    await fs.mkdir(installedDir);
  });

  afterEach(() => fs.rm(workDir, { recursive: true, force: true }));

  test('writes a complete install into the target of each set', async () => {
    await populate(installedDir, declaredFiles(PRIMITIVES));
    const radix = planSet(setFor('radix-vega'), workDir);
    const base = planSet(setFor('base-vega'), workDir);

    await applyPlan(radix, installedDir);
    await applyPlan(base, installedDir);

    expect(await fs.readdir(radix.target)).toHaveLength(PRIMITIVES.length);
    expect(await fs.readdir(base.target)).toHaveLength(PRIMITIVES.length);
    expect(radix.target).not.toBe(base.target);
  });

  test('rejects an undeclared file before writing anything', async () => {
    await populate(installedDir, [...declaredFiles(PRIMITIVES), 'surprise.tsx']);
    const plan = planSet(setFor('radix-vega'), workDir);

    await expect(applyPlan(plan, installedDir)).rejects.toThrow(/surprise\.tsx/);
    expect(await fs.readdir(workDir)).toEqual(['installed']);
  });

  test('removes a file of the radix target that is not an installed primitive', async () => {
    await populate(installedDir, declaredFiles(PRIMITIVES));
    const plan = planSet(setFor('radix-vega'), workDir);
    await fs.mkdir(plan.target);
    await fs.writeFile(path.join(plan.target, 'form.tsx'), 'form');

    await applyPlan(plan, installedDir);

    expect(await fs.readdir(plan.target)).not.toContain('form.tsx');
  });
});
