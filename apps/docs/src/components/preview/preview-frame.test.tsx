import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { PreviewFrame } from './preview-frame';

const frameClasses = (markup: string) => markup.match(/class="([^"]*)"/)?.[1].split(' ') ?? [];

describe('PreviewFrame', () => {
  const markup = renderToStaticMarkup(<PreviewFrame registryName='demo.example' component={() => <p>demo</p>} />);

  test('shows the example inside the frame', () => {
    expect(markup).toContain('<p>demo</p>');
  });

  test('scrolls a wide example horizontally inside the frame', () => {
    expect(frameClasses(markup)).toContain('overflow-x-auto');
  });

  test('centres a narrow example without cutting off a wide one', () => {
    expect(frameClasses(markup)).toContain('justify-center-safe');
    expect(frameClasses(markup)).not.toContain('justify-center');
  });

  test('says so when the example is missing from the registry', () => {
    const missing = renderToStaticMarkup(<PreviewFrame registryName='ghost.example' component={undefined} />);
    expect(missing).toContain('ghost.example');
    expect(missing).toContain('not found in registry');
  });
});
