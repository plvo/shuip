import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import type ts from 'typescript';
import { attributeNames, elementsNamed, parseTsx, tsxSourceFiles } from './documents';

const SOURCES = tsxSourceFiles();

// An icon-only link has no name of its own, so a screen reader announces it as a bare "link".
describe('the expand button of the preview cards', () => {
  test('is the one link that carries an aria-label in its module', () => {
    const file = SOURCES.find((candidate) => path.basename(candidate) === 'expand-button.tsx') as string;
    const links = elementsNamed(parseTsx(file), 'Link');

    expect(links).toHaveLength(1);
    expect(attributeNames(links[0] as ts.JsxOpeningLikeElement)).toContain('aria-label');
  });

  test.each(
    SOURCES.filter((file) => elementsNamed(parseTsx(file), 'ExpandButton').length > 0),
  )('%s passes the label to every ExpandButton', (file) => {
    for (const element of elementsNamed(parseTsx(file), 'ExpandButton')) {
      expect(attributeNames(element)).toContain('label');
    }
  });
});

/** The text of the block that opens at `opening`, braces matched. */
const blockAt = (css: string, opening: string): string => {
  const start = css.indexOf(opening);
  if (start === -1) return '';
  let depth = 0;
  for (let index = css.indexOf('{', start); index < css.length; index++) {
    depth += css[index] === '{' ? 1 : css[index] === '}' ? -1 : 0;
    if (depth === 0) return css.slice(start, index + 1);
  }
  return '';
};

describe('the view transitions of the docs', () => {
  const css = fs.readFileSync(path.resolve(import.meta.dir, '..', 'src', 'styles', 'globals.css'), 'utf-8');
  const reducedMotion = blockAt(css, '@media (prefers-reduced-motion: reduce)');

  test('morph a card into its full page and back', () => {
    expect(css).toContain('::view-transition-group(.preview-morph)');
  });

  test('play no animation of any transition when the reader prefers reduced motion', () => {
    expect(reducedMotion).not.toBe('');
    for (const pseudoElement of ['group', 'old', 'new']) {
      expect(reducedMotion).toContain(`::view-transition-${pseudoElement}(*)`);
    }
    expect(reducedMotion).toMatch(/animation:\s*none\s*!important/);
  });

  test('leave the morph out of the reduced-motion block, which removes it', () => {
    expect(reducedMotion).not.toContain('.preview-morph');
  });
});
