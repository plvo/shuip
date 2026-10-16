import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { attributeOrder, attributeValues, elementsNamed, parseTsx } from './jsx-source';

const ITEMS_DIR = path.resolve(import.meta.dir, '../items');
const SUGGESTION_LIST = '@/components/ui/shuip/suggestion-list';
const COMMAND = '@/components/ui/command';
const INPUT_PROPS = 'suggestionList.inputProps';
const LISTBOX_PROPS = 'suggestionList.listboxProps';

interface Field {
  item: string;
  variant: 'radix' | 'base';
  popup: string;
  anchor: string;
}

const FIELDS: Field[] = ['radix', 'base'].flatMap((variant) =>
  ['react-hook-form/autocomplete-field', 'tanstack-form/autocomplete-field', 'react-hook-form/address-field'].map(
    (item) => ({
      item,
      variant: variant as Field['variant'],
      popup: variant === 'radix' ? 'PopoverContent' : 'PopoverPrimitive.Popup',
      anchor: variant === 'radix' ? 'PopoverAnchor' : 'PopoverPrimitive.Positioner',
    }),
  ),
);

const parse = ({ item, variant }: Field) => {
  const file = path.join(ITEMS_DIR, item, `component.${variant}.tsx`);
  return parseTsx(file, fs.readFileSync(file, 'utf-8'));
};

const importDeclarations = (source: ts.SourceFile, specifier: string): ts.ImportDeclaration[] =>
  source.statements.filter(
    (statement): statement is ts.ImportDeclaration =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === specifier,
  );

const namedImports = (source: ts.SourceFile, specifier: string): string[] =>
  importDeclarations(source, specifier).flatMap((declaration) =>
    declaration.importClause?.namedBindings !== undefined && ts.isNamedImports(declaration.importClause.namedBindings)
      ? declaration.importClause.namedBindings.elements.map((element) => element.name.text)
      : [],
  );

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
    expect(namedImports(source, SUGGESTION_LIST)).toEqual(
      expect.arrayContaining(['SuggestionOption', 'useSuggestionList']),
    );
  });

  test('imports nothing from the command primitive', () => {
    expect(importDeclarations(source, COMMAND)).toEqual([]);
  });

  test('spreads the combobox props last on the input', () => {
    const attributes = attributeOrder(source, 'Input').flat();
    const afterInputProps = attributes.slice(attributes.indexOf(`...${INPUT_PROPS}`) + 1);

    expect(attributes).toContain(`...${INPUT_PROPS}`);
    expect(afterInputProps.filter((attribute) => attribute.startsWith('...'))).toEqual([]);
  });

  test('spreads the listbox props on the popup that holds the options', () => {
    expect(attributeOrder(source, field.popup).flat()).toContain(`...${LISTBOX_PROPS}`);
  });

  test('gives the field label and each option the id the listbox and the input refer to', () => {
    expect(attributeValues(source, 'FieldLabel', 'id')).toEqual(['suggestionList.labelId']);
    expect(attributeValues(source, 'SuggestionOption', 'id')).toEqual(['suggestionList.optionId(index)']);
  });
});

describe.each(FIELDS.filter((field) => field.item.endsWith('address-field')))('$item $variant', (field) => {
  const source = parse(field);

  test('anchors the popup to the input without a popover trigger', () => {
    expect(mentions(source, 'PopoverTrigger')).toBe(false);
    expect(elementsNamed(source, field.anchor)).toHaveLength(1);
  });
});
