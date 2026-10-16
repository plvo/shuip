import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DefaultErrorFallback, QueryBoundary } from './component.radix';

const renderFallback = (queryKeys?: string[]) =>
  renderToStaticMarkup(
    createElement(DefaultErrorFallback, { error: new Error('boom'), resetErrorBoundary: () => {}, queryKeys }),
  );

const visibleText = (markup: string) => markup.replace(/<[^>]*>/g, ' ');

describe('DefaultErrorFallback', () => {
  test('announces the error message as an alert with a Retry action', () => {
    const markup = renderFallback(['users']);
    expect(markup).toMatch(/<div[^>]*role="alert"/);
    expect(visibleText(markup)).toContain('boom');
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

// The error path of QueryBoundary (the queryKeys pass-through and the errorFallback override) needs a DOM to catch a
// thrown error in an ErrorBoundary, so it is not covered here.
describe('QueryBoundary loading state', () => {
  const Suspending = () => {
    throw new Promise<void>(() => {});
  };

  test('renders the default loading fallback while a child suspends', () => {
    const markup = renderToStaticMarkup(createElement(QueryBoundary, null, createElement(Suspending)));
    expect(markup).toContain('Loading...');
  });

  test('renders the custom loading fallback while a child suspends', () => {
    const markup = renderToStaticMarkup(
      createElement(
        QueryBoundary,
        { loadingFallback: createElement('p', null, 'Fetching users') },
        createElement(Suspending),
      ),
    );
    expect(markup).toContain('Fetching users');
    expect(markup).not.toContain('Loading...');
  });

  test('renders the children once nothing suspends', () => {
    const markup = renderToStaticMarkup(createElement(QueryBoundary, null, createElement('p', null, 'Ready')));
    expect(markup).toContain('Ready');
    expect(markup).not.toContain('Loading...');
  });
});
