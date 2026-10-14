import { describe, expect, test } from 'bun:test';
import path from 'node:path';

const RUN_SCRIPT = path.join(import.meta.dir, 'run.ts');

const smoke = (...args: string[]) => {
  const result = Bun.spawnSync(['bun', RUN_SCRIPT, ...args], { stdout: 'pipe', stderr: 'pipe' });
  return { exitCode: result.exitCode, stdout: result.stdout.toString(), stderr: result.stderr.toString() };
};

describe('smoke entry point', () => {
  test.each([
    'aria-nova',
    'default',
    'new-york-v4',
    'base',
  ])('rejects %s, which cannot be scaffolded, and says why', (style) => {
    const { exitCode, stderr } = smoke(style);
    expect(exitCode).toBe(2);
    expect(stderr).toContain(`Unsupported style "${style}"`);
  });

  test('reports an unknown option as a failed run instead of exiting without a word', () => {
    const { exitCode, stderr } = smoke('base-vega', '--no-such-option');
    expect(exitCode).toBe(1);
    expect(stderr).toContain('[smoke] unexpected error');
    expect(stderr).toContain('--no-such-option');
  });
});
