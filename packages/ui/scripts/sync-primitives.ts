import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

const UI_PKG = path.resolve(import.meta.dir, '..');
const COMPONENTS_DIR = path.join(UI_PKG, 'src', 'components');

/**
 * Primitives vendored from the official shadcn registry. Transitive primitives
 * (e.g. `field` needs `label` and `separator`) must be listed explicitly.
 */
export const PRIMITIVES = [
  'badge',
  'button',
  'calendar',
  'card',
  'checkbox',
  'collapsible',
  'command',
  'dialog',
  'drawer',
  'field',
  'hover-card',
  'input',
  'input-group',
  'label',
  'popover',
  'radio-group',
  'select',
  'separator',
  'table',
  'tabs',
  'textarea',
  'tooltip',
];

export interface PrimitiveSet {
  /** Official shadcn style the set is fetched from. */
  style: string;
  /** Folder under `src/components` that receives the set. */
  dir: string;
  /** Files in `dir` that are not managed by the sync. */
  unmanaged: string[];
}

export const SETS: PrimitiveSet[] = [
  { style: 'radix-vega', dir: 'ui', unmanaged: ['form.tsx'] },
  { style: 'base-vega', dir: 'ui-base', unmanaged: [] },
];

interface ComponentsConfig {
  style: string;
  tailwind: { css: string };
  aliases: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Derives the throwaway project config from the UI package config. Only the style and the aliases
 * change: the aliases point at the project layout, with `ui` targeting the folder of the set.
 */
export const buildComponentsConfig = (base: ComponentsConfig, { style, dir }: PrimitiveSet): ComponentsConfig => ({
  ...base,
  style,
  aliases: {
    components: '@/components',
    utils: '@/lib/utils',
    ui: `@/components/${dir}`,
    lib: '@/lib',
    hooks: '@/hooks',
  },
});

export const declaredFiles = (primitives: string[]) => primitives.map((name) => `${name}.tsx`);

export const diffDeclared = (installed: string[], expected: string[]) => ({
  missing: expected.filter((file) => !installed.includes(file)),
  undeclared: installed.filter((file) => !expected.includes(file)),
});

export const assertDeclared = (style: string, installed: string[], expected: string[]) => {
  const { missing, undeclared } = diffDeclared(installed, expected);
  if (missing.length > 0 || undeclared.length > 0) {
    throw new Error(
      `${style}: installed files differ from the declared primitives. ` +
        `Missing: [${missing.join(', ')}]. Not declared (add them to PRIMITIVES): [${undeclared.join(', ')}].`,
    );
  }
};

const listFiles = async (dir: string) => {
  try {
    return (await fs.readdir(dir, { recursive: true, withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)));
  } catch {
    return [];
  }
};

/**
 * Mirrors the installed files into `target`. Files already identical are left untouched, files in
 * `target` that were not installed are removed, except the `unmanaged` ones.
 */
export const mirrorInstalledFiles = async (installedDir: string, target: string, unmanaged: string[]) => {
  const installed = await listFiles(installedDir);
  await fs.mkdir(target, { recursive: true });

  let written = 0;
  for (const file of installed) {
    const content = await fs.readFile(path.join(installedDir, file), 'utf-8');
    const existing = await fs.readFile(path.join(target, file), 'utf-8').catch(() => null);
    if (existing !== content) {
      await fs.mkdir(path.dirname(path.join(target, file)), { recursive: true });
      await fs.writeFile(path.join(target, file), content);
      written++;
    }
  }

  let removed = 0;
  for (const file of await listFiles(target)) {
    if (!installed.includes(file) && !unmanaged.includes(file)) {
      await fs.rm(path.join(target, file));
      removed++;
    }
  }

  return { written, removed };
};

const run = async (cmd: string[], cwd: string) => {
  const proc = Bun.spawn(cmd, { cwd, stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) {
    throw new Error(`${cmd.join(' ')} exited with ${code}\n${stdout}\n${stderr}`);
  }
};

/**
 * Installs the primitives with the shadcn CLI into a throwaway project whose aliases match the
 * ones used here, so the files come out exactly as a consumer project would receive them.
 */
const installIntoThrowawayProject = async (set: PrimitiveSet) => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), `shuip-${set.style}-`));
  const write = (file: string, content: unknown) =>
    fs.writeFile(path.join(project, file), `${JSON.stringify(content, null, 2)}\n`);

  const baseConfig: ComponentsConfig = JSON.parse(await fs.readFile(path.join(UI_PKG, 'components.json'), 'utf-8'));
  const config = buildComponentsConfig(baseConfig, set);

  await fs.mkdir(path.dirname(path.join(project, config.tailwind.css)), { recursive: true });
  await fs.writeFile(path.join(project, config.tailwind.css), '@import "tailwindcss";\n');
  await write('package.json', {
    name: `shuip-${set.style}`,
    private: true,
    type: 'module',
    dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', tailwindcss: '^4.0.0' },
  });
  await write('tsconfig.json', { compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } } });
  await write('components.json', config);

  await run(
    ['bun', 'run', 'shadcn', 'add', ...PRIMITIVES, '--cwd', project, '--yes', '--overwrite', '--silent'],
    UI_PKG,
  );
  return project;
};

const syncSet = async (set: PrimitiveSet) => {
  const project = await installIntoThrowawayProject(set);
  try {
    const installedDir = path.join(project, 'src', 'components', set.dir);
    assertDeclared(set.style, await listFiles(installedDir), declaredFiles(PRIMITIVES));

    const { written, removed } = await mirrorInstalledFiles(
      installedDir,
      path.join(COMPONENTS_DIR, set.dir),
      set.unmanaged,
    );
    console.log(`[sync-primitives] ${set.style} -> src/components/${set.dir}: ${written} written, ${removed} removed`);
  } finally {
    await fs.rm(project, { recursive: true, force: true });
  }
};

const sync = async () => {
  for (const set of SETS) {
    await syncSet(set);
  }
};

if (import.meta.main) {
  sync().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
