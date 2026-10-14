import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertNoRadixPackages, findRadixPackages } from './project-dependencies';
import { StepFailure } from './step';

describe('findRadixPackages', () => {
  test('finds Radix packages in every dependency field', () => {
    expect(
      findRadixPackages({
        dependencies: { '@radix-ui/react-select': '^2.0.0', react: '^19.0.0' },
        devDependencies: { 'radix-ui': '^1.8.1' },
        peerDependencies: { '@radix-ui/react-icons': '^1.3.0' },
      }),
    ).toEqual(['@radix-ui/react-select', 'radix-ui', '@radix-ui/react-icons']);
  });

  test('ignores packages that merely look like Radix', () => {
    expect(findRadixPackages({ dependencies: { '@base-ui/react': '^1.0.0', 'radix-ui-extras': '1.0.0' } })).toEqual([]);
  });
});

describe('assertNoRadixPackages', () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-deps-'));
  });
  afterEach(() => fs.rmSync(projectDir, { recursive: true, force: true }));

  const manifest = (content: object) =>
    fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(content));

  test('passes for a project without Radix packages', async () => {
    manifest({ dependencies: { '@base-ui/react': '^1.9.0' } });
    await expect(assertNoRadixPackages(projectDir)).resolves.toBeUndefined();
  });

  test('names the Radix packages a project depends on', async () => {
    manifest({ dependencies: { '@base-ui/react': '^1.9.0', 'radix-ui': '^1.8.1' } });
    const failure = await assertNoRadixPackages(projectDir).catch((error) => error);
    expect(failure).toBeInstanceOf(StepFailure);
    expect((failure as StepFailure).output).toContain('radix-ui');
  });
});
