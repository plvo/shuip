import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CodeHighlight } from './code-highlight';

const render = async (code: string) => renderToStaticMarkup(await CodeHighlight({ code }));

/** What the server sends to the client for a node: the props of every element, as the RSC payload carries them. */
const payloadOf = (node: React.ReactNode): unknown =>
  Array.isArray(node)
    ? node.map(payloadOf)
    : React.isValidElement<Record<string, unknown>>(node)
      ? [
          node.type,
          Object.fromEntries(Object.entries(node.props).map(([name, value]) => [name, payloadOf(value as never)])),
        ]
      : node;

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
});
