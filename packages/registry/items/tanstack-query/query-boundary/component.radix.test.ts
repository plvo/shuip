import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DefaultErrorFallback } from './component.radix';

const renderFallback = (queryKeys?: string[]) =>
  renderToStaticMarkup(
    createElement(DefaultErrorFallback, { error: new Error('boom'), resetErrorBoundary: () => {}, queryKeys }),
  );

const visibleText = (markup: string) => markup.replace(/<[^>]*>/g, ' ');

describe('DefaultErrorFallback', () => {
  test('shows the error message and a retry button', () => {
    const markup = renderFallback(['users']);
    expect(markup).toContain('boom');
    expect(markup).toContain('Retry');
  });

  test('renders no stray 0 and no query line without query keys', () => {
    expect(visibleText(renderFallback())).not.toContain('0');
    expect(visibleText(renderFallback([]))).not.toContain('0');
    expect(renderFallback()).not.toContain('Concerned quer');
  });

  test('lists the query keys', () => {
    expect(visibleText(renderFallback(['users']))).toContain('Concerned query: users');
    expect(visibleText(renderFallback(['users', 'posts']))).toContain('Concerned queries: users, posts');
  });
});
