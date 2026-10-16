import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { filesUnder } from './documents';

const SRC_DIR = path.resolve(import.meta.dir, '..', 'src');

const parse = (file: string) =>
  ts.createSourceFile(file, fs.readFileSync(file, 'utf-8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

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
      const opening = ts.isJsxElement(element) ? element.openingElement : element;
      found.push(
        opening.attributes.properties.flatMap((attribute) =>
          ts.isJsxAttribute(attribute) ? [attribute.name.getText()] : ['...spread'],
        ),
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

const files = filesUnder(SRC_DIR, ['.tsx'])
  .filter((file) => !file.includes('.test.'))
  .filter((file) => bannerElements(parse(file)).length > 0);

// fumadocs renders the sidebar banner inside an array of children, so an element built on the server without a key
// makes React warn about a missing "key" prop on every page.
describe('the sidebar banner of the docs layouts', () => {
  test('is passed by the based section layout', () => {
    expect(files.map((file) => path.basename(file))).toEqual(['based-section-layout.tsx']);
  });

  test.each(files)('%s gives the banner element a key', (file) => {
    for (const attributes of bannerElements(parse(file))) {
      expect(attributes).toContain('key');
    }
  });
});
