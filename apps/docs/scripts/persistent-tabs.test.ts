import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const SRC_DIR = path.resolve(import.meta.dir, '..', 'src');
const FUMADOCS_TABS = 'fumadocs-ui/components/tabs';

const sourcesIn = (folder: string): string[] =>
  fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) return sourcesIn(file);
    return /\.tsx$/.test(entry.name) && !entry.name.includes('.test.') ? [file] : [];
  });

const parse = (file: string) =>
  ts.createSourceFile(file, fs.readFileSync(file, 'utf-8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

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
      found.push(
        node.attributes.properties.flatMap((attribute) =>
          ts.isJsxAttribute(attribute) ? [attribute.name.getText()] : ['...spread'],
        ),
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

const files = sourcesIn(SRC_DIR).filter((file) => importsTabs(parse(file)));

// A group of tabs that does not persist sends the reader back to its default tab on every page.
describe('the fumadocs Tabs of the docs', () => {
  test('are used by the install block and the examples', () => {
    expect(files.map((file) => path.basename(file)).sort()).toEqual(['item-installation.tsx', 'item-preview.tsx']);
  });

  test.each(files)('%s gives every Tabs a groupId and persist', (file) => {
    const elements = tabsElements(parse(file));

    expect(elements.length).toBeGreaterThan(0);
    for (const attributes of elements) {
      expect(attributes).toContain('groupId');
      expect(attributes).toContain('persist');
    }
  });
});
