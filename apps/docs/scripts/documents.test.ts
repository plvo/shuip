import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import { REPOSITORY_ROOT, readDocuments } from './documents';

describe('readDocuments', () => {
  test('reads each file under its path from the repository root', () => {
    const [readme] = readDocuments([path.join(REPOSITORY_ROOT, 'README.md')]);

    expect(readme.name).toBe('README.md');
    expect(readme.text).toContain('shuip');
  });

  test('fails on a file that does not exist', () => {
    expect(() => readDocuments([path.join(REPOSITORY_ROOT, 'does-not-exist.md')])).toThrow('does-not-exist.md');
  });
});
