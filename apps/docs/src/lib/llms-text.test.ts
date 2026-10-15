import { describe, expect, test } from 'bun:test';
import { llmsText } from './llms-text';

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
