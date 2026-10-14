import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { SHUIP_NAMESPACE, shuipItemRef, shuipRegistryUrl } from '@repo/registry/namespace';
import { type Base, styleToBase } from '@repo/registry/style-base';
import { assertEveryItemServedLocally } from './install-source';
import { serveRegistry } from './server';
import { runStep, StepFailure } from './step';

const REPO_ROOT = path.resolve(import.meta.dir, '..', '..', '..', '..');
const DOCS_PUBLIC = path.join(REPO_ROOT, 'apps', 'docs', 'public');
const DEFAULT_STYLE = 'radix-vega';
const PROJECT_NAME = 'app';

interface ScaffoldStyle {
  style: string;
  base: Base;
  preset: string;
}

// Only `<base>-<preset>` styles can be scaffolded; legacy styles (`new-york-v4`, `default`) have no preset.
const parseScaffoldStyle = (style: string): ScaffoldStyle | null => {
  const base = styleToBase(style);
  return base && style.startsWith(`${base}-`) ? { style, base, preset: style.slice(base.length + 1) } : null;
};

const initArgs = ({ base, preset }: ScaffoldStyle): string[] => [
  'init',
  '-t',
  'next',
  '-b',
  base,
  '-p',
  preset,
  '-n',
  PROJECT_NAME,
  '--no-monorepo',
  '-y',
];

const fetchItemNames = async (registryOrigin: string, style: string): Promise<string[]> => {
  const response = await fetch(`${registryOrigin}/r/${style}/registry.json`);
  if (!response.ok) {
    throw new StepFailure('list items', `GET ${response.url} answered ${response.status}`);
  }
  const registry = (await response.json()) as { items: { name: string }[] };
  return registry.items.map((item) => item.name);
};

const configureNamespace = async (projectDir: string, registryOrigin: string): Promise<void> => {
  const componentsFile = path.join(projectDir, 'components.json');
  const components = JSON.parse(await fs.readFile(componentsFile, 'utf-8'));
  components.registries = { ...components.registries, [SHUIP_NAMESPACE]: shuipRegistryUrl(registryOrigin) };
  await fs.writeFile(componentsFile, `${JSON.stringify(components, null, 2)}\n`);
};

const settleAll = async (...tasks: Promise<unknown>[]): Promise<void> => {
  const failure = (await Promise.allSettled(tasks)).find((result) => result.status === 'rejected');
  if (failure) {
    throw failure.reason;
  }
};

const smokeTest = async (scaffold: ScaffoldStyle, keep: boolean): Promise<string> => {
  const server = serveRegistry(DOCS_PUBLIC);
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'shuip-smoke-'));
  const projectDir = path.join(workDir, PROJECT_NAME);
  try {
    await settleAll(
      runStep('build registry', ['bun', 'run', 'registry:build'], REPO_ROOT),
      runStep('scaffold project', ['bunx', 'shadcn@latest', ...initArgs(scaffold)], workDir),
    );

    const names = await fetchItemNames(server.origin, scaffold.style);
    await configureNamespace(projectDir, server.origin);
    await runStep(
      'install items',
      ['bunx', 'shadcn@latest', 'add', ...names.map(shuipItemRef), '-y', '-o'],
      projectDir,
    );
    assertEveryItemServedLocally(server.servedPaths, scaffold.style, names);
    await runStep('type-check', [path.join(projectDir, 'node_modules', '.bin', 'tsc'), '--noEmit'], projectDir);

    return `${names.length} items installed and type-checked${keep ? ` (project kept at ${projectDir})` : ''}`;
  } finally {
    server.stop();
    if (!keep) {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  }
};

const main = async (): Promise<void> => {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: { keep: { type: 'boolean', default: false } },
    allowPositionals: true,
  });
  const style = positionals[0] ?? DEFAULT_STYLE;
  const scaffold = parseScaffoldStyle(style);
  if (!scaffold) {
    console.error(`Unsupported style "${style}". Use <base>-<preset> with base or radix, e.g. ${DEFAULT_STYLE}.`);
    process.exit(2);
  }

  const startedAt = performance.now();
  try {
    const summary = await smokeTest(scaffold, values.keep);
    console.log(`[smoke] ${style}: ${summary} in ${Math.round((performance.now() - startedAt) / 1000)}s`);
  } catch (error) {
    if (error instanceof StepFailure) {
      console.error(`[smoke] ${style}: ${error.message}\n\n${error.output}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
};

await main();
