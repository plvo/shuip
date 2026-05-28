import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  applyCatalog,
  applySkillSourcesToDocs,
  assertUniqueNames,
  emitSkills,
  parseSkillFrontmatter,
  resolveCatalog,
} from './skills';

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

describe('applySkillSourcesToDocs', () => {
  test('replaces a single marked region with a 4-backtick md fence containing the source', () => {
    const docs = 'before\n{/* shuip:skill:start name="a" */}\nOLD\n{/* shuip:skill:end */}\nafter\n';
    const out = applySkillSourcesToDocs(docs, new Map([['a', '---\nname: a\n---\nbody\n']]));
    expect(out).toBe(
      'before\n{/* shuip:skill:start name="a" */}\n````md\n---\nname: a\n---\nbody\n````\n{/* shuip:skill:end */}\nafter\n',
    );
  });

  test('replaces multiple marked regions independently', () => {
    const docs =
      '{/* shuip:skill:start name="a" */}\nOLD-A\n{/* shuip:skill:end */}\n' +
      'middle\n' +
      '{/* shuip:skill:start name="b" */}\nOLD-B\n{/* shuip:skill:end */}\n';
    const out = applySkillSourcesToDocs(
      docs,
      new Map([
        ['a', 'A\n'],
        ['b', 'B\n'],
      ]),
    );
    expect(out).toBe(
      '{/* shuip:skill:start name="a" */}\n````md\nA\n````\n{/* shuip:skill:end */}\n' +
        'middle\n' +
        '{/* shuip:skill:start name="b" */}\n````md\nB\n````\n{/* shuip:skill:end */}\n',
    );
  });

  test('is idempotent when re-applied with the same sources', () => {
    const docs = '{/* shuip:skill:start name="a" */}\nOLD\n{/* shuip:skill:end */}\n';
    const sources = new Map([['a', '---\nname: a\n---\n']]);
    const once = applySkillSourcesToDocs(docs, sources);
    expect(applySkillSourcesToDocs(once, sources)).toBe(once);
  });

  test('returns docs unchanged when no skill markers are present', () => {
    const docs = '# agent skills\nno markers here\n';
    expect(applySkillSourcesToDocs(docs, new Map([['a', 'A\n']]))).toBe(docs);
  });

  test('throws when a marker references an unknown skill', () => {
    const docs = '{/* shuip:skill:start name="missing" */}\nX\n{/* shuip:skill:end */}\n';
    expect(() => applySkillSourcesToDocs(docs, new Map([['a', 'A\n']]))).toThrow(
      'unknown skill "missing" referenced in docs page',
    );
  });

  test('normalizes a source without trailing newline', () => {
    const docs = '{/* shuip:skill:start name="a" */}\nX\n{/* shuip:skill:end */}\n';
    const out = applySkillSourcesToDocs(docs, new Map([['a', 'no-trailing-nl']]));
    expect(out).toBe('{/* shuip:skill:start name="a" */}\n````md\nno-trailing-nl\n````\n{/* shuip:skill:end */}\n');
  });
});

describe('emitSkills', () => {
  let root: string;
  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-skills-'));
    const skillsDir = path.join(root, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'demo'), { recursive: true });
    fs.writeFileSync(
      path.join(skillsDir, 'demo', 'SKILL.md'),
      '---\nname: demo\ndescription: A demo.\n---\n<!-- shuip:catalog:start -->\nOLD\n<!-- shuip:catalog:end -->\n',
    );
  });
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  test('writes resolved files, returns skill items + bundle, and exposes raw sources', () => {
    const skillsDir = path.join(root, 'skills');
    const result = emitSkills({
      skillsDir,
      generatedDir: path.join(skillsDir, '.generated'),
      registryRoot: root,
      catalog: '**components**\n- `x`',
      registryBaseUrl: 'https://shuip.plvo.dev/r',
      bundleName: 'shuip-skills',
    });

    const written = fs.readFileSync(path.join(skillsDir, '.generated', 'demo', 'SKILL.md'), 'utf-8');
    expect(written).toContain('**components**\n- `x`');
    expect(written).not.toContain('OLD');

    expect(result.items).toEqual([
      {
        name: 'demo',
        type: 'registry:item',
        files: [
          { path: './skills/.generated/demo/SKILL.md', type: 'registry:file', target: '.claude/skills/demo/SKILL.md' },
        ],
      },
      {
        name: 'shuip-skills',
        type: 'registry:item',
        registryDependencies: ['https://shuip.plvo.dev/r/demo'],
      },
    ]);

    expect(result.sources.get('demo')).toBe(
      '---\nname: demo\ndescription: A demo.\n---\n<!-- shuip:catalog:start -->\nOLD\n<!-- shuip:catalog:end -->\n',
    );
  });
});
