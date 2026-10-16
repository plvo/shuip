import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { attributeNames, parseTsx, tsxSourceFiles } from './documents';

const elementsNamed = (source: ts.SourceFile, tagName: string): ts.JsxOpeningLikeElement[] => {
  const found: ts.JsxOpeningLikeElement[] = [];
  const visit = (node: ts.Node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText() === tagName) {
      found.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

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

describe('the view transitions of the docs', () => {
  const css = fs.readFileSync(path.resolve(import.meta.dir, '..', 'src', 'styles', 'globals.css'), 'utf-8');
  const reducedMotion = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));

  test('morph a card into its full page and back', () => {
    expect(css).toContain('::view-transition-group(.preview-morph)');
  });

  test('play no animation when the reader prefers reduced motion', () => {
    for (const pseudoElement of ['group', 'old', 'new']) {
      expect(reducedMotion).toContain(`::view-transition-${pseudoElement}(*)`);
    }
    expect(reducedMotion).toContain('animation: none !important');
  });
});
