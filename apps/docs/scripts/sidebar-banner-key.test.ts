import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import ts from 'typescript';
import { attributeNames, parseTsx, tsxSourceFiles } from './documents';

/** The attribute names of every element passed inline as a `banner` prop in the file. */
const bannerElements = (source: ts.SourceFile): string[][] => {
  const found: string[][] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText() === 'banner' &&
      node.initializer !== undefined &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression !== undefined &&
      (ts.isJsxSelfClosingElement(node.initializer.expression) || ts.isJsxElement(node.initializer.expression))
    ) {
      const element = node.initializer.expression;
      found.push(attributeNames(ts.isJsxElement(element) ? element.openingElement : element));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

const files = tsxSourceFiles().filter((file) => bannerElements(parseTsx(file)).length > 0);

// fumadocs renders the sidebar banner inside an array of children, so an element built on the server without a key
// makes React warn about a missing "key" prop on every page.
describe('the sidebar banner of the docs layouts', () => {
  test('is found where the based section layout passes it', () => {
    const names = files.map((file) => path.basename(file));

    expect(names, 'the scan found no banner element in based-section-layout.tsx: it moved or the scan broke').toContain(
      'based-section-layout.tsx',
    );
  });

  test.each(files)('%s gives the banner element a key', (file) => {
    for (const attributes of bannerElements(parseTsx(file))) {
      expect(attributes).toContain('key');
    }
  });
});
