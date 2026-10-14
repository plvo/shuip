import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { SHUIP_NAMESPACE, SHUIP_REGISTRY_URL, shuipItemRef } from '@repo/registry/namespace';
import { styleToBase } from '@repo/registry/style-base';
import { serveRegistry } from './server';

const REPO_ROOT = path.resolve(import.meta.dir, '..', '..', '..', '..');
const DOCS_PUBLIC = path.join(REPO_ROOT, 'apps', 'docs', 'public');
const DEFAULT_STYLE = 'radix-vega';
const PROJECT_NAME = 'app';

class StepFailure extends Error {
  constructor(
    readonly step: string,
    readonly output: string,
  ) {
    super(`${step} failed`);
  }
}

const runStep = async (step: string, cmd: string[], cwd: string): Promise<string> => {
  const child = Bun.spawn({
    cmd,
    cwd,
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env, CI: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  const output = [stdout, stderr].filter(Boolean).join('\n').trim();
  if (exitCode !== 0) {
    throw new StepFailure(step, output);
  }
  return output;
};

const initArgs = (style: string): string[] => {
  const [base, ...preset] = style.split('-');
  return ['init', '-t', 'next', '-b', base, '-p', preset.join('-'), '-n', PROJECT_NAME, '--no-monorepo', '-y'];
};

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
  components.registries = {
    ...components.registries,
    [SHUIP_NAMESPACE]: SHUIP_REGISTRY_URL.replace('https://shuip.plvo.dev', registryOrigin),
  };
  await fs.writeFile(componentsFile, `${JSON.stringify(components, null, 2)}\n`);
};

const smokeTest = async (style: string, keep: boolean): Promise<string> => {
  await runStep('build registry', ['bun', 'run', 'registry:build'], REPO_ROOT);

  const server = serveRegistry(DOCS_PUBLIC);
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'shuip-smoke-'));
  const projectDir = path.join(workDir, PROJECT_NAME);
  try {
    const registryOrigin = server.url.origin;
    const names = await fetchItemNames(registryOrigin, style);

    await runStep('scaffold project', ['bunx', 'shadcn@latest', ...initArgs(style)], workDir);
    await configureNamespace(projectDir, registryOrigin);
    await runStep(
      'install items',
      ['bunx', 'shadcn@latest', 'add', ...names.map(shuipItemRef), '-y', '-o'],
      projectDir,
    );
    await runStep('type-check', [path.join(projectDir, 'node_modules', '.bin', 'tsc'), '--noEmit'], projectDir);

    return `${names.length} items installed and type-checked${keep ? ` (project kept at ${projectDir})` : ''}`;
  } finally {
    await server.stop(true);
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
  if (!styleToBase(style)) {
    console.error(`Unsupported style "${style}". Expected base-<preset> or radix-<preset>, e.g. ${DEFAULT_STYLE}.`);
    process.exit(2);
  }

  const startedAt = performance.now();
  try {
    const summary = await smokeTest(style, values.keep);
    console.log(`[smoke] ${style}: ${summary} in ${Math.round((performance.now() - startedAt) / 1000)}s`);
  } catch (error) {
    if (error instanceof StepFailure) {
      console.error(`[smoke] ${style}: ${error.step} failed\n\n${error.output}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
};

await main();
