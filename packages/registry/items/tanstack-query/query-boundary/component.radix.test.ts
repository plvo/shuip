import { describe, expect, test } from 'bun:test';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { FallbackProps } from 'react-error-boundary';
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

type QueryErrorResetBoundaryElement = ReactElement<{ children: (value: { reset: () => void }) => ReactElement }>;
type ErrorBoundaryElement = ReactElement<{ onReset: () => void; fallbackRender: (props: FallbackProps) => ReactNode }>;

// The wiring is read off the element tree: catching a thrown error is react-error-boundary's job and is not exercised.
describe('QueryBoundary error wiring', () => {
  const reset = () => {};
  const failure: FallbackProps = { error: new Error('boom'), resetErrorBoundary: () => {} };

  const errorBoundaryOf = (props: Parameters<typeof QueryBoundary>[0]) => {
    const resetBoundary = QueryBoundary(props) as QueryErrorResetBoundaryElement;
    return resetBoundary.props.children({ reset }) as ErrorBoundaryElement;
  };

  test('resets the queries when the error boundary resets', () => {
    expect(errorBoundaryOf({ children: null }).props.onReset).toBe(reset);
  });

  test('passes the query keys to the default error fallback', () => {
    const { fallbackRender } = errorBoundaryOf({ children: null, queryKeys: ['users', 'posts'] }).props;
    expect(visibleText(renderToStaticMarkup(fallbackRender(failure)))).toContain('Concerned queries: users, posts');
  });

  test('replaces the default error fallback with a custom one', () => {
    const errorFallback = ({ error }: FallbackProps) =>
      createElement('p', null, `custom: ${error instanceof Error ? error.message : ''}`);
    const { fallbackRender } = errorBoundaryOf({ children: null, queryKeys: ['users'], errorFallback }).props;
    const markup = renderToStaticMarkup(fallbackRender(failure));
    expect(markup).toContain('custom: boom');
    expect(markup).not.toContain('Oops, something went wrong!');
  });
});
