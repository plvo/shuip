import { describe, expect, test } from 'bun:test';
import { applyCatalog, assertUniqueNames, parseSkillFrontmatter, resolveCatalog } from './skills';

describe('parseSkillFrontmatter', () => {
  test('extracts name and description', () => {
    const src = '---\nname: shuip-forms\ndescription: Use when building a form.\n---\n\n# body\n';
    expect(parseSkillFrontmatter(src)).toEqual({
      name: 'shuip-forms',
      description: 'Use when building a form.',
    });
  });

  test('throws when frontmatter is absent', () => {
    expect(() => parseSkillFrontmatter('# no frontmatter')).toThrow('missing YAML frontmatter');
  });

  test('throws when name is missing', () => {
    expect(() => parseSkillFrontmatter('---\ndescription: x\n---\n')).toThrow('missing "name"');
  });

  test('throws when description is missing', () => {
    expect(() => parseSkillFrontmatter('---\nname: x\n---\n')).toThrow('missing "description"');
  });
});

describe('resolveCatalog', () => {
  test('groups published names by category in fixed order, sorted, skipping empties', () => {
    const catalog = resolveCatalog([
      { category: 'react-hook-form', publishedName: 'rhf-input-field' },
      { category: 'components', publishedName: 'side-dialog' },
      { category: 'components', publishedName: 'copy-button' },
      { category: 'react-hook-form', publishedName: 'rhf-address-field' },
      { category: 'lib', publishedName: 'time' },
    ]);
    expect(catalog).toBe(
      '**components**\n' +
        '- `copy-button`\n' +
        '- `side-dialog`\n\n' +
        '**react-hook-form**\n' +
        '- `rhf-address-field`\n' +
        '- `rhf-input-field`',
    );
  });
});

describe('applyCatalog', () => {
  test('replaces content between markers, keeping the markers', () => {
    const src = 'before\n<!-- shuip:catalog:start -->\nOLD\nLINES\n<!-- shuip:catalog:end -->\nafter\n';
    const out = applyCatalog(src, '**components**\n- `x`');
    expect(out).toBe(
      'before\n<!-- shuip:catalog:start -->\n**components**\n- `x`\n<!-- shuip:catalog:end -->\nafter\n',
    );
  });

  test('returns source unchanged when no start marker is present', () => {
    const src = '# overview\nno markers here\n';
    expect(applyCatalog(src, 'ANY')).toBe(src);
  });

  test('is idempotent when re-applied with the same catalog', () => {
    const src = '<!-- shuip:catalog:start -->\nA\n<!-- shuip:catalog:end -->\n';
    const once = applyCatalog(src, '**components**\n- `x`');
    expect(applyCatalog(once, '**components**\n- `x`')).toBe(once);
  });
});

describe('assertUniqueNames', () => {
  test('passes when there is no overlap', () => {
    expect(() => assertUniqueNames(['side-dialog', 'rhf-input-field'], ['shuip-forms'])).not.toThrow();
  });

  test('throws naming the colliding item', () => {
    expect(() => assertUniqueNames(['shuip-forms', 'side-dialog'], ['shuip-forms'])).toThrow(
      'collide with component items: shuip-forms',
    );
  });
});
