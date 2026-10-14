import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseScaffoldStyle } from './scaffold';
import type { StepFailure } from './step';
import { verifyInstall } from './verify-install';

describe('verifyInstall', () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-verify-'));
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  const writeManifest = (dependencies: Record<string, string>): void => {
    fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({ dependencies }));
  };

  const verify = (style: string, servedPaths: string[]): Promise<void> =>
    verifyInstall({
      scaffold: parseScaffoldStyle(style) as NonNullable<ReturnType<typeof parseScaffoldStyle>>,
      projectDir,
      names: ['search-input'],
      servedPaths: new Set(servedPaths),
    });

  const failureOf = async (task: Promise<unknown>): Promise<StepFailure> => {
    try {
      await task;
    } catch (error) {
      return error as StepFailure;
    }
    throw new Error('expected the verification to fail');
  };

  test.each([
    ['@radix-ui/react-dialog'],
    ['radix-ui'],
  ])('fails a base project that depends on %s', async (radixPackage) => {
    writeManifest({ [radixPackage]: '^1.0.0' });
    const failure = await failureOf(verify('base-vega', ['/r/base-vega/search-input.json']));
    expect(failure.message).toBe('verify dependencies failed');
    expect(failure.output).toContain(radixPackage);
  });

  test('accepts the same dependencies in a radix project', async () => {
    writeManifest({ 'radix-ui': '^1.0.0', '@radix-ui/react-dialog': '^1.0.0' });
    await verify('radix-vega', ['/r/radix-vega/search-input.json']);
  });

  test('accepts a base project without a radix package', async () => {
    writeManifest({ '@base-ui/react': '^1.9.0' });
    await verify('base-vega', ['/r/base-vega/search-input.json']);
  });

  test.each([
    'base-vega',
    'radix-vega',
  ])('fails a %s install that never requested an item from the local registry', async (style) => {
    writeManifest({});
    const failure = await failureOf(verify(style, []));
    expect(failure.message).toBe('verify install source failed');
    expect(failure.output).toContain('search-input');
  });
});
