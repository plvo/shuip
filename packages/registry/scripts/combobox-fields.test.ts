import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ITEMS_DIR = path.resolve(import.meta.dir, '../items');
const SUGGESTION_LIST = '@/components/ui/shuip/suggestion-list';
const COMMAND = '@/components/ui/command';

interface Field {
  item: string;
  variant: 'radix' | 'base';
  popup: string;
}

const FIELDS: Field[] = ['radix', 'base'].flatMap((variant) =>
  ['react-hook-form/autocomplete-field', 'tanstack-form/autocomplete-field', 'react-hook-form/address-field'].map(
    (item) => ({
      item,
      variant: variant as Field['variant'],
      popup: variant === 'radix' ? 'PopoverContent' : 'PopoverPrimitive.Popup',
    }),
  ),
);

const parse = ({ item, variant }: Field) => {
  const file = path.join(ITEMS_DIR, item, `component.${variant}.tsx`);
  return ts.createSourceFile(file, fs.readFileSync(file, 'utf-8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
};

const importedNames = (source: ts.SourceFile, specifier: string): string[] =>
  source.statements.flatMap((statement) =>
    ts.isImportDeclaration(statement) &&
    ts.isStringLiteral(statement.moduleSpecifier) &&
    statement.moduleSpecifier.text === specifier &&
    statement.importClause?.namedBindings !== undefined &&
    ts.isNamedImports(statement.importClause.namedBindings)
      ? statement.importClause.namedBindings.elements.map((element) => element.name.text)
      : [],
  );

/** The spread attributes (`{...x.y}`) of every JSX element named `tag`. */
const spreadsOf = (source: ts.SourceFile, tag: string): string[][] => {
  const found: string[][] = [];
  const visit = (node: ts.Node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText() === tag) {
      found.push(
        node.attributes.properties.flatMap((attribute) =>
          ts.isJsxSpreadAttribute(attribute) ? [attribute.expression.getText()] : [],
        ),
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

const mentions = (source: ts.SourceFile, identifier: string): boolean => {
  let found = false;
  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node) && node.text === identifier) found = true;
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

describe.each(FIELDS)('$item $variant', (field) => {
  const source = parse(field);

  test('takes the combobox wiring from the shared suggestion list', () => {
    expect(importedNames(source, SUGGESTION_LIST)).toEqual(
      expect.arrayContaining(['SuggestionOption', 'useSuggestionList']),
    );
    expect(importedNames(source, COMMAND)).toEqual([]);
  });

  test('spreads the combobox props on the input', () => {
    expect(spreadsOf(source, 'Input').flat()).toContain('suggestionList.inputProps');
  });

  test('spreads the listbox props on the popup that holds the options', () => {
    expect(spreadsOf(source, field.popup).flat()).toContain('suggestionList.listboxProps');
  });
});

describe.each(FIELDS.filter((field) => field.item.endsWith('address-field')))('$item $variant', (field) => {
  test('anchors the popup to the input without a popover trigger', () => {
    const source = parse(field);

    expect(mentions(source, 'PopoverTrigger')).toBe(false);
    expect(mentions(source, field.variant === 'radix' ? 'PopoverAnchor' : 'Positioner')).toBe(true);
  });
});
