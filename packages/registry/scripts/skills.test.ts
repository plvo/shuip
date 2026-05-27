import { describe, expect, test } from 'bun:test';
import { parseSkillFrontmatter, resolveCatalog } from './skills';

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
