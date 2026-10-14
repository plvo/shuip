import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { SHUIP_NAMESPACE, shuipItemRef, shuipRegistryUrl } from '@repo/registry/namespace';
import { styleRewrites } from '@repo/registry/style-base';
import { removeWorkDir } from './cleanup';
import { initArgs, PROJECT_NAME, parseScaffoldStyle, type ScaffoldStyle } from './scaffold';
import { selectItems } from './select-items';
import { serveRegistry } from './server';
import { inStep, reportFailure, runStep, settleAll } from './step';
import { verifyInstall } from './verify-install';

const REPO_ROOT = path.resolve(import.meta.dir, '..', '..', '..', '..');
const DOCS_PUBLIC = path.join(REPO_ROOT, 'apps', 'docs', 'public');
const DEFAULT_STYLE = 'radix-vega';

interface SmokeOptions {
  keep: boolean;
  items: string[] | undefined;
}

const fetchItemNames = async (registryOrigin: string, style: string): Promise<string[]> => {
  const response = await fetch(`${registryOrigin}/r/${style}/registry.json`);
  if (!response.ok) {
    throw new Error(`GET ${response.url} answered ${response.status}`);
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

const smokeTest = async (scaffold: ScaffoldStyle, { keep, items }: SmokeOptions): Promise<string> => {
  const server = serveRegistry(DOCS_PUBLIC, styleRewrites());
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'shuip-smoke-'));
  const projectDir = path.join(workDir, PROJECT_NAME);
  try {
    await settleAll(
      runStep('build registry', ['bun', 'run', 'registry:build'], REPO_ROOT),
      runStep('scaffold project', ['bunx', 'shadcn@latest', ...initArgs(scaffold)], workDir),
    );

    const names = selectItems(await inStep('list items', () => fetchItemNames(server.origin, scaffold.style)), items);
    await inStep('configure registry', () => configureNamespace(projectDir, server.origin));
    await runStep(
      'install items',
      ['bunx', 'shadcn@latest', 'add', ...names.map(shuipItemRef), '-y', '-o'],
      projectDir,
    );
    await verifyInstall({ scaffold, projectDir, names, servedPaths: server.servedPaths });
    await runStep('type-check', [path.join(projectDir, 'node_modules', '.bin', 'tsc'), '--noEmit'], projectDir);

    return `${names.length} items installed and type-checked${keep ? ` (project kept at ${projectDir})` : ''}`;
  } finally {
    server.stop();
    if (!keep) {
      await removeWorkDir(workDir);
    }
  }
};

// Awaited so the report reaches the pipe before the process exits.
const exitWith = async (report: string, exitCode: number): Promise<never> => {
  await Bun.write(Bun.stderr, `${report}\n`);
  process.exit(exitCode);
};

const main = async (): Promise<void> => {
  const startedAt = performance.now();
  let style: string | undefined;
  try {
    const { values, positionals } = parseArgs({
      args: Bun.argv.slice(2),
      options: {
        keep: { type: 'boolean', default: false },
        items: { type: 'string' },
      },
      allowPositionals: true,
    });
    style = positionals[0] ?? DEFAULT_STYLE;
    const scaffold = parseScaffoldStyle(style);
    if (!scaffold) {
      return await exitWith(
        `Unsupported style "${style}". Use <base>-<preset> with base or radix, e.g. ${DEFAULT_STYLE}.`,
        2,
      );
    }

    const summary = await smokeTest(scaffold, { keep: values.keep, items: values.items?.split(',') });
    console.log(`[smoke] ${style}: ${summary} in ${Math.round((performance.now() - startedAt) / 1000)}s`);
  } catch (error) {
    await exitWith(reportFailure(error, style), 1);
  }
};

await main();
