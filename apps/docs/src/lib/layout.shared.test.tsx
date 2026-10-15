import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { baseOptions } from './layout.shared';

describe('navigation title', () => {
  const title = baseOptions().nav?.title;
  const markup = renderToStaticMarkup(<div>{title}</div>);

  test('names the site in text', () => {
    expect(markup.replace(/<[^>]+>/g, '')).toBe('shuip');
  });

  test('shows the mark, hidden from assistive technology', () => {
    expect(markup).toMatch(/<svg[^>]*aria-hidden="true"/);
  });
});
