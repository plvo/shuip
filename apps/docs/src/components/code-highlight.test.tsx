import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { highlightHast } from 'fumadocs-core/highlight';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { hastToHtml } from 'shiki';
import { codeHighlightOptions } from '@/lib/code-themes';
import { CodeHighlight } from './code-highlight';
import { HighlightedLines } from './highlighted-lines';

const render = async (code: string) => renderToStaticMarkup(await CodeHighlight({ code }));

const hasUseClientDirective = (file: string): boolean => /^\s*['"]use client['"]/.test(readFileSync(file, 'utf-8'));

/** The components the code block renders on the client, with the module each one comes from. */
const clientModuleOf = new Map<unknown, string>([
  [HighlightedLines, `${import.meta.dir}/highlighted-lines.tsx`],
  [CodeBlock, Bun.resolveSync('fumadocs-ui/components/codeblock', import.meta.dir)],
  [Pre, Bun.resolveSync('fumadocs-ui/components/codeblock', import.meta.dir)],
]);

/**
 * What the server sends to the client for a node, as the RSC payload carries it: a component of a module with the
 * `'use client'` directive is sent with its props, any other component runs on the server and its output is sent.
 */
const payloadOf = (node: React.ReactNode): unknown => {
  if (Array.isArray(node)) return node.map(payloadOf);
  if (!React.isValidElement<Record<string, unknown>>(node)) return node;

  const { type, props } = node;
  const module = clientModuleOf.get(type);
  if (typeof type === 'function' && !(module && hasUseClientDirective(module))) {
    return payloadOf((type as (props: unknown) => React.ReactNode)(props));
  }
  return [
    typeof type === 'function' ? type.name : type,
    Object.fromEntries(Object.entries(props).map(([name, value]) => [name, payloadOf(value as never)])),
  ];
};

/** The text the copy button of fumadocs copies: the text content of the first `pre` of the code block. */
const copiedTextOf = (markup: string): string => {
  document.body.innerHTML = markup;
  return document.getElementsByTagName('pre').item(0)?.textContent ?? '';
};

const SOURCE = `import type * as React from 'react';

// Renders the items of a list, or nothing when the list is empty.
export const Field = ({ items }: { items: string[] }) => (
  <div className="a&b" data-x='1'>
    {items.length > 0 && items.map((item) => <span key={item}>{item}</span>)}
  </div>
);

export const total = (values: number[]): number => values.reduce((sum, value) => sum + value, 0);
`;

const ITEM_SOURCE = `'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationControlsProps {
  /** The zero-based index of the page that is shown. */
  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  className?: string;
}

/** The previous and next buttons of a paginated list, with the position of the page that is shown. */
export function PaginationControls({ pageIndex, pageCount, onPageChange, className }: PaginationControlsProps) {
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex >= pageCount - 1;

  return (
    <div className={cn('flex items-center justify-between gap-2 px-2 py-4 text-sm text-muted-foreground', className)}>
      <span>
        Page {pageIndex + 1} of {pageCount}
      </span>
      <div className='flex items-center gap-2'>
        <Button variant='outline' size='sm' disabled={isFirstPage} onClick={() => onPageChange(pageIndex - 1)}>
          Previous
        </Button>
        <Button variant='outline' size='sm' disabled={isLastPage} onClick={() => onPageChange(pageIndex + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
`;

const registrySource = (file: string) =>
  readFileSync(`${import.meta.dir}/../../../../packages/registry/items/${file}`, 'utf-8');

const SOURCES_TO_MIRROR: Record<string, string> = {
  'astral characters': "const label = '𝒳 😀 𝒳𝒳';\nconst next = label + '😀';",
  'CJK characters': "const title = '你好，世界';\n// 日本語のコメント\nconst 名前 = 'テスト';",
  'tab indentation': 'function f() {\n\treturn {\n\t\ta: 1,\n\t};\n}',
  'empty lines': 'const a = 1;\n\n\nconst b = 2;',
  'a line without tokens': 'const a = 1;\n  \t \nconst b = 2;',
  'a trailing newline': 'const a = 1;\n',
  'no code': '',
  'CRLF line endings': 'const a = 1;\r\n\r\nconst b = 2;\r\n',
  'CR line endings': 'const a = 1;\rconst b = 2;',
  'the data-table source': registrySource('blocks/data-table/component.radix.tsx'),
  'the rhf-address-field source': registrySource('react-hook-form/address-field/component.radix.tsx'),
};

describe('CodeHighlight', () => {
  beforeAll(() => GlobalRegistrator.register());
  afterAll(() => GlobalRegistrator.unregister());

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

  test('paints a comment with the readable colours of both color schemes', async () => {
    const markup = await render('// a comment');

    expect(markup).toContain('--shiki-light:#606871;--shiki-dark:#828B95');
  });

  test('keeps the payload sent to the client within twice the plain source', async () => {
    const source = ITEM_SOURCE.repeat(3);

    const payload = JSON.stringify(payloadOf(await CodeHighlight({ code: source })));

    expect(payload.length).toBeLessThan(2 * JSON.stringify(source).length);
  });

  test('keeps the exact source as the text the copy button reads', async () => {
    expect(copiedTextOf(await render(SOURCE))).toBe(SOURCE);
  });

  describe('markup', () => {
    for (const [name, source] of Object.entries(SOURCES_TO_MIRROR)) {
      test(`is the markup Shiki produces for ${name}`, async () => {
        const root = await highlightHast(source, { lang: 'tsx', ...codeHighlightOptions });
        const pre = root.children[0];
        if (pre?.type !== 'element' || pre.children[0]?.type !== 'element') throw new Error('Shiki returned no code');
        const shikiCode = document.createElement('div');
        shikiCode.innerHTML = hastToHtml(pre.children[0]);

        document.body.innerHTML = await render(source);

        expect(document.querySelector('pre > code')?.innerHTML).toBe(shikiCode.firstElementChild?.innerHTML);
        expect(document.querySelector('figure')?.getAttribute('style')).toBe(String(pre.properties.style));
        expect(document.querySelector('figure')?.className).toContain(String(pre.properties.class));
      });
    }
  });
});
