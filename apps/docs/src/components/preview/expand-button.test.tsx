import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { previewCardWiring } from '@/lib/preview-routes';
import { ExpandButton } from './expand-button';

const buttonFor = (registryName: string) => {
  const { href, label } = previewCardWiring('base', registryName, 'page');
  return renderToStaticMarkup(<ExpandButton href={href} label={label} origin='page:x' />);
};

describe('ExpandButton', () => {
  test('links to the full page of the example', () => {
    expect(buttonFor('copy-button.with-custom-icons.example')).toContain(
      'href="/preview/base/copy-button/with-custom-icons"',
    );
  });

  test('is named after the example it opens, for assistive technology', () => {
    expect(buttonFor('copy-button.example')).toContain('aria-label="Open Copy Button full page"');
    expect(buttonFor('copy-button.with-custom-icons.example')).toContain(
      'aria-label="Open Copy Button With Custom Icons full page"',
    );
  });

  test('hides its icon from assistive technology, so the name is the label alone', () => {
    expect(buttonFor('copy-button.example')).toMatch(/<svg[^>]*aria-hidden="true"/);
  });
});
