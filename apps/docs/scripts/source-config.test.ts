import { describe, expect, test } from 'bun:test';
import { rehypeCode } from 'fumadocs-core/mdx-plugins';
import config from '../source.config';

const codeBlock = (code: string) => ({
  type: 'root' as const,
  children: [
    {
      type: 'element' as const,
      tagName: 'pre',
      properties: {},
      children: [
        {
          type: 'element' as const,
          tagName: 'code',
          properties: { className: ['language-tsx'] },
          children: [{ type: 'text' as const, value: code }],
        },
      ],
    },
  ],
});

describe('the MDX code blocks of the docs', () => {
  test('are highlighted with the readable light theme', async () => {
    const tree = codeBlock('const f = (field: string) => field;');

    await rehypeCode(config.mdxOptions?.rehypeCodeOptions || undefined)(tree, {} as never);

    const markup = JSON.stringify(tree);
    expect(markup).toContain('--shiki-light:#AC4A07');
    expect(markup).not.toContain('#E36209');
  });
});
