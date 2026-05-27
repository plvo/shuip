import { describe, expect, test } from 'bun:test';
import { parseSkillFrontmatter } from './skills';

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
