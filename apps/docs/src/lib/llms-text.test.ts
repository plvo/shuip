import { describe, expect, test } from 'bun:test';
import { llmsFullDocument, llmsFullText, llmsText } from './llms-text';

const PROCESSED = [
  'Intro.',
  '',
  '<BaseOnly base="radix">',
  '',
  '<Trigger asChild><Button /></Trigger>',
  '',
  '</BaseOnly>',
  '',
  '<BaseOnly base="base">',
  '',
  '<Trigger render={<Button />} />',
  '',
  '</BaseOnly>',
].join('\n');

const page = (url: string) => ({ title: 'Side Dialog', url, processed: PROCESSED });

describe('llmsText', () => {
  test('keeps the Radix blocks and drops the Base UI ones for a Radix page', () => {
    const text = llmsText(page('/components/radix/side-dialog'));

    expect(text).toContain('asChild');
    expect(text).not.toContain('render=');
    expect(text).not.toContain('BaseOnly');
  });

  test('keeps the Base UI blocks and drops the Radix ones for a Base UI page', () => {
    const text = llmsText(page('/components/base/side-dialog'));

    expect(text).toContain('render=');
    expect(text).not.toContain('asChild');
    expect(text).not.toContain('BaseOnly');
  });

  test('titles the page and points at its other variant', () => {
    const text = llmsText(page('/components/radix/side-dialog'));

    expect(text.startsWith('# Side Dialog (/components/radix/side-dialog)')).toBe(true);
    expect(text).toContain('This is the Radix variant. Base UI variant: /components/base/side-dialog');
  });

  test('leaves the markdown of a page without a base as it is', () => {
    const text = llmsText(page('/docs/installation'));

    expect(text).toContain('<BaseOnly base="radix">');
    expect(text).not.toContain('variant');
  });
});

describe('llmsFullText', () => {
  const text = llmsFullText(['# First page', '# Second page']);

  test('scopes the Base UI variant to the component and block pages', () => {
    expect(text).toContain('The component and block pages below are the Base UI variant');
  });

  test('points at the Radix pages and their markdown for components and blocks', () => {
    expect(text).toContain('/components/radix/<name>');
    expect(text).toContain('/components/llms.mdx/radix/<name>');
    expect(text).toContain('/blocks/radix/<name>');
    expect(text).toContain('/blocks/llms.mdx/radix/<name>');
  });

  test('lists the pages after the pointer, in order', () => {
    expect(text.indexOf('/components/radix/<name>')).toBeLessThan(text.indexOf('# First page'));
    expect(text.endsWith('# First page\n\n# Second page')).toBe(true);
  });
});

describe('llmsFullDocument', () => {
  const page = (title: string, url: string) => ({ url, data: { title, getText: async () => `Body of ${title}.` } });

  test('is the pointer followed by the markdown of every page, in order', async () => {
    const document = await llmsFullDocument([
      page('Installation', '/docs/installation'),
      page('Side Dialog', '/components/base/side-dialog'),
    ]);

    expect(document.startsWith(llmsFullText([]))).toBe(true);
    expect(document.indexOf('# Installation (/docs/installation)')).toBeLessThan(
      document.indexOf('# Side Dialog (/components/base/side-dialog)'),
    );
    expect(document).toContain('Body of Installation.');
    expect(document).toContain('This is the Base UI variant. Radix variant: /components/radix/side-dialog');
  });
});
