import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

const UI_PKG = path.resolve(import.meta.dir, '..');
const COMPONENTS_DIR = path.join(UI_PKG, 'src', 'components');

/**
 * Primitives vendored from the official shadcn registry. Transitive primitives
 * (e.g. `field` needs `label` and `separator`) must be listed explicitly.
 */
const PRIMITIVES = [
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

interface PrimitiveSet {
  /** Official shadcn style the set is fetched from. */
  style: string;
  /** Folder under `src/components` that receives the set. */
  dir: string;
  /** Files in `dir` that are not managed by the sync. */
  unmanaged: string[];
}

const SETS: PrimitiveSet[] = [
  { style: 'radix-vega', dir: 'ui', unmanaged: ['form.tsx'] },
  { style: 'base-vega', dir: 'ui-base', unmanaged: [] },
];

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
const installIntoThrowawayProject = async ({ style, dir }: PrimitiveSet) => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), `shuip-${style}-`));
  const write = (file: string, content: unknown) =>
    fs.writeFile(path.join(project, file), `${JSON.stringify(content, null, 2)}\n`);

  await fs.mkdir(path.join(project, 'src', 'styles'), { recursive: true });
  await fs.writeFile(path.join(project, 'src', 'styles', 'globals.css'), '@import "tailwindcss";\n');
  await write('package.json', {
    name: `shuip-${style}`,
    private: true,
    type: 'module',
    dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', tailwindcss: '^4.0.0' },
  });
  await write('tsconfig.json', { compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } } });
  await write('components.json', {
    $schema: 'https://ui.shadcn.com/schema.json',
    style,
    rsc: true,
    tsx: true,
    tailwind: { config: '', css: 'src/styles/globals.css', baseColor: 'neutral', cssVariables: true },
    aliases: {
      components: '@/components',
      utils: '@/lib/utils',
      ui: `@/components/${dir}`,
      lib: '@/lib',
      hooks: '@/hooks',
    },
    iconLibrary: 'lucide',
  });

  await run(
    ['bun', 'run', 'shadcn', 'add', ...PRIMITIVES, '--cwd', project, '--yes', '--overwrite', '--silent'],
    UI_PKG,
  );
  return project;
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

const syncSet = async (set: PrimitiveSet) => {
  const project = await installIntoThrowawayProject(set);
  try {
    const installedDir = path.join(project, 'src', 'components', set.dir);
    const installed = await listFiles(installedDir);
    const expected = PRIMITIVES.map((name) => `${name}.tsx`);

    const missing = expected.filter((file) => !installed.includes(file));
    const undeclared = installed.filter((file) => !expected.includes(file));
    if (missing.length > 0 || undeclared.length > 0) {
      throw new Error(
        `${set.style}: installed files differ from the declared primitives. ` +
          `Missing: [${missing.join(', ')}]. Not declared (add them to PRIMITIVES): [${undeclared.join(', ')}].`,
      );
    }

    const target = path.join(COMPONENTS_DIR, set.dir);
    await fs.mkdir(target, { recursive: true });

    let written = 0;
    for (const file of installed) {
      const content = await fs.readFile(path.join(installedDir, file), 'utf-8');
      const existing = await fs.readFile(path.join(target, file), 'utf-8').catch(() => null);
      if (existing !== content) {
        await fs.writeFile(path.join(target, file), content);
        written++;
      }
    }

    let removed = 0;
    for (const file of await listFiles(target)) {
      if (!installed.includes(file) && !set.unmanaged.includes(file)) {
        await fs.rm(path.join(target, file));
        removed++;
      }
    }

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

sync().catch((e) => {
  console.error(e);
  process.exit(1);
});
