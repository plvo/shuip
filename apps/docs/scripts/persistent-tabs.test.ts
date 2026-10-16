import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import ts from 'typescript';
import { attributeNames, parseTsx, tsxSourceFiles } from './documents';

const FUMADOCS_TABS = 'fumadocs-ui/components/tabs';

const importsTabs = (source: ts.SourceFile): boolean =>
  source.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === FUMADOCS_TABS &&
      statement.importClause?.namedBindings !== undefined &&
      ts.isNamedImports(statement.importClause.namedBindings) &&
      statement.importClause.namedBindings.elements.some((element) => element.name.text === 'Tabs'),
  );

/** The attribute names of every `<Tabs …>` element of the file. */
const tabsElements = (source: ts.SourceFile): string[][] => {
  const found: string[][] = [];
  const visit = (node: ts.Node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText() === 'Tabs') {
      found.push(attributeNames(node));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

const files = tsxSourceFiles().filter((file) => importsTabs(parseTsx(file)));

// A group of tabs that does not persist sends the reader back to its default tab on every page.
describe('the fumadocs Tabs of the docs', () => {
  test('are used by the install block and the examples', () => {
    expect(files.map((file) => path.basename(file)).sort()).toEqual(['item-installation.tsx', 'item-preview.tsx']);
  });

  test.each(files)('%s gives every Tabs a groupId and persist', (file) => {
    const elements = tabsElements(parseTsx(file));

    expect(elements.length).toBeGreaterThan(0);
    for (const attributes of elements) {
      expect(attributes).toContain('groupId');
      expect(attributes).toContain('persist');
    }
  });
});
