import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShuipMark } from './shuip-mark';

const pathData = (markup: string): string[] => [...markup.matchAll(/ d="([^"]+)"/g)].map(([, d]) => d);

describe('ShuipMark', () => {
  const markup = renderToStaticMarkup(<ShuipMark />);

  test('is hidden from assistive technology, the surrounding link names it', () => {
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain('<title');
  });

  test('draws the same arcs as the source mark', () => {
    const source = fs.readFileSync(path.join(import.meta.dir, '..', 'assets', 'shuip-mark.svg'), 'utf-8');

    expect(pathData(markup)).toEqual(pathData(source));
  });

  test('follows the text colour', () => {
    expect(markup).toContain('stroke="currentColor"');
  });

  test('takes a class name to size it', () => {
    expect(renderToStaticMarkup(<ShuipMark className='size-6' />)).toContain('class="size-6"');
  });
});
