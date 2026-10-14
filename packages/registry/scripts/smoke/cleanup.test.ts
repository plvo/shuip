import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { removeWorkDir } from './cleanup';

describe('removeWorkDir', () => {
  test('removes the directory without a warning', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-cleanup-'));
    fs.writeFileSync(path.join(dir, 'file'), 'x');
    const warnings: string[] = [];

    await removeWorkDir(dir, (message) => warnings.push(message));

    expect(fs.existsSync(dir)).toBe(false);
    expect(warnings).toEqual([]);
  });

  test('warns about a removal that fails instead of throwing, so the failure that ended the run stays visible', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-cleanup-'));
    try {
      fs.writeFileSync(path.join(dir, 'file'), 'x');
      const unremovable = path.join(dir, 'file', 'child');
      const warnings: string[] = [];

      await removeWorkDir(unremovable, (message) => warnings.push(message));

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('ENOTDIR');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
