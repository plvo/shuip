import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { CodeHighlight } from './code-highlight';

const render = async (code: string) => renderToStaticMarkup(await CodeHighlight({ code }));

describe('CodeHighlight', () => {
  test('colours the tokens for both color schemes, like the MDX code blocks', async () => {
    const markup = await render('const field = 1;');

    expect(markup).toMatch(/--shiki-light:#[0-9a-f]{6}/i);
    expect(markup).toMatch(/--shiki-dark:#[0-9a-f]{6}/i);
  });

  test('paints a parameter with the readable light colour', async () => {
    const markup = await render('const f = (field: string) => field;');

    expect(markup).toContain('--shiki-light:#AC4A07');
    expect(markup).not.toContain('#E36209');
  });
});
