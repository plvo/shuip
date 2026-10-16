import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { attributeValues, elementsNamed, parseTsx } from './jsx-source';

const ITEM_DIR = path.resolve(import.meta.dir, '../items/react-hook-form/address-field');
const VARIANTS = ['radix', 'base'] as const;
const SHARED_DECLARATIONS = [
  'ADDRESS_NOT_SELECTED_MESSAGE',
  'AddressErrors',
  'addressFieldError',
  'ControlledField',
  'clearFilledFields',
  'ElementTarget',
  'handElementToFields',
  'lookupPlaceDetails',
];

const parse = (variant: (typeof VARIANTS)[number]) => {
  const file = path.join(ITEM_DIR, `component.${variant}.tsx`);
  return parseTsx(file, fs.readFileSync(file, 'utf-8'));
};

const nodesOf = <T extends ts.Node>(root: ts.Node, guard: (node: ts.Node) => node is T): T[] => {
  const found: T[] = [];
  const visit = (node: ts.Node) => {
    if (guard(node)) found.push(node);
    ts.forEachChild(node, visit);
  };
  visit(root);
  return found;
};

const initializerOf = (source: ts.SourceFile, name: string): ts.Expression | undefined =>
  nodesOf(source, ts.isVariableDeclaration).find(
    (declaration) => declaration.name.getText() === name && declaration.initializer !== undefined,
  )?.initializer;

const callsTo = (root: ts.Node | undefined, callee: string): ts.CallExpression[] =>
  root === undefined ? [] : nodesOf(root, ts.isCallExpression).filter((call) => call.expression.getText() === callee);

const hasAncestor = (node: ts.Node, predicate: (ancestor: ts.Node) => boolean): boolean => {
  for (let ancestor = node.parent; ancestor !== undefined; ancestor = ancestor.parent) {
    if (predicate(ancestor)) return true;
  }
  return false;
};

const declaredName = (statement: ts.Statement): string | undefined => {
  if (ts.isVariableStatement(statement)) return statement.declarationList.declarations[0]?.name.getText();
  if (
    ts.isFunctionDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement)
  ) {
    return statement.name?.text;
  }
  return undefined;
};

const sharedDeclarations = (source: ts.SourceFile): Record<string, string> =>
  Object.fromEntries(
    source.statements.flatMap((statement) => {
      const name = declaredName(statement);
      return name !== undefined && SHARED_DECLARATIONS.includes(name) ? [[name, statement.getText()]] : [];
    }),
  );

/** The statements run by the arrow function given as attribute `name` of the first element `tag`. */
const handlerStatements = (source: ts.SourceFile, tag: string, name: string): string[] => {
  const [element] = elementsNamed(source, tag);
  const attribute = element?.attributes.properties.find(
    (property): property is ts.JsxAttribute => ts.isJsxAttribute(property) && property.name.getText() === name,
  );
  return attribute === undefined ? [] : nodesOf(attribute, ts.isExpressionStatement).map((s) => s.getText());
};

describe('the error selection and the place clearing shipped in both variants', () => {
  test('are the same code in the radix and base files', () => {
    const radix = sharedDeclarations(parse('radix'));

    expect(Object.keys(radix).sort()).toEqual([...SHARED_DECLARATIONS].sort());
    expect(sharedDeclarations(parse('base'))).toEqual(radix);
  });
});

describe.each(VARIANTS)('AddressField in the %s variant', (variant) => {
  const source = parse(variant);

  test('gives the input a ref that hands the element to the controller of every field of the address', () => {
    const setInputRef = initializerOf(source, 'setInputRef');
    const [handOver] = callsTo(setInputRef, 'handElementToFields');
    const [controllers, node] = handOver?.arguments ?? [];

    expect(attributeValues(source, 'Input', 'ref')).toEqual(['setInputRef']);
    expect(setInputRef?.getText()).toContain('inputRef.current = node');
    expect(node?.getText()).toBe('node');
    expect(
      controllers !== undefined && ts.isArrayLiteralExpression(controllers)
        ? controllers.elements.map((element) => element.getText())
        : [],
    ).toEqual(['fullAddress', 'street', 'city', 'postalCode', 'countryField']);
  });

  test('renders a single error below the input, out of the label', () => {
    const [fieldError, ...others] = elementsNamed(source, 'FieldError');

    expect(others).toEqual([]);
    expect(fieldError).toBeDefined();
    expect(
      hasAncestor(
        fieldError,
        (ancestor) => ts.isJsxElement(ancestor) && ancestor.openingElement.tagName.getText() === 'FieldLabel',
      ),
    ).toBe(false);
    expect(attributeValues(source, 'FieldError', 'errors')).toEqual(['[error]']);
    expect(
      hasAncestor(
        fieldError,
        (ancestor) =>
          ts.isBinaryExpression(ancestor) &&
          ancestor.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
          ancestor.left.getText() === 'invalid',
      ),
    ).toBe(true);
  });

  test('derives the error from the five controllers of the address', () => {
    const [call] = callsTo(initializerOf(source, 'error'), 'addressFieldError');
    const [errors] = call?.arguments ?? [];
    const passed =
      errors !== undefined && ts.isObjectLiteralExpression(errors)
        ? Object.fromEntries(
            errors.properties.flatMap((property) =>
              ts.isPropertyAssignment(property) ? [[property.name.getText(), property.initializer.getText()]] : [],
            ),
          )
        : {};

    expect(passed).toEqual({
      fullAddress: 'fullAddress.fieldState.error',
      street: 'street.fieldState.error',
      city: 'city.fieldState.error',
      postalCode: 'postalCode.fieldState.error',
      country: 'countryField.fieldState.error',
    });
  });

  test('marks the field and the input invalid from that error', () => {
    expect(initializerOf(source, 'invalid')?.getText()).toBe('error !== undefined');
    expect(attributeValues(source, 'Field', 'data-invalid')).toEqual(['invalid']);
    expect(attributeValues(source, 'Input', 'aria-invalid')).toEqual(['invalid']);
  });

  test('points the input at the error while the field is invalid, next to any description it already has', () => {
    const describedBy = initializerOf(source, 'describedBy')?.getText() ?? '';

    const errorId = initializerOf(source, 'errorId');
    const [span] = errorId !== undefined && ts.isTemplateExpression(errorId) ? errorId.templateSpans : [];

    expect(span?.expression.getText()).toBe('id');
    expect(span?.literal.text).toBe('-error');
    expect(attributeValues(source, 'FieldError', 'id')).toEqual(['errorId']);
    expect(attributeValues(source, 'Input', 'aria-describedby')).toEqual(['describedBy']);
    expect(describedBy).toContain("props['aria-describedby']");
    expect(describedBy).toContain('invalid ? errorId : undefined');
  });

  test('clears the five place fields', () => {
    const [call] = callsTo(initializerOf(source, 'clearPlace'), 'clearFilledFields');
    const [controllers] = call?.arguments ?? [];

    expect(
      controllers !== undefined && ts.isArrayLiteralExpression(controllers)
        ? controllers.elements.map((element) => element.getText())
        : [],
    ).toEqual(['street', 'city', 'postalCode', 'countryField', 'placeId']);
  });

  test('clears the place before the typed text reaches the form', () => {
    const statements = handlerStatements(source, 'Input', 'onChange');
    const clearedAt = statements.indexOf('clearPlace();');
    const writtenAt = statements.findIndex((statement) => statement.startsWith('fullAddress.field.onChange('));

    expect(clearedAt).toBeGreaterThanOrEqual(0);
    expect(writtenAt).toBeGreaterThan(clearedAt);
  });

  test('awaits the place details lookup through lookupPlaceDetails', () => {
    const [lookup, ...others] = callsTo(source, 'getPlaceDetails');
    const [guarded] = callsTo(initializerOf(source, 'details'), 'lookupPlaceDetails');
    const [fetcher] = guarded?.arguments ?? [];

    expect(others).toEqual([]);
    expect(initializerOf(source, 'details')?.kind).toBe(ts.SyntaxKind.AwaitExpression);
    expect(fetcher !== undefined && ts.isArrowFunction(fetcher)).toBe(true);
    expect(lookup !== undefined && hasAncestor(lookup, (ancestor) => ancestor === fetcher)).toBe(true);
  });

  test('treats place details without a result as not picked', () => {
    const detailsBranch = nodesOf(source, ts.isIfStatement).find(
      (statement) => statement.expression.getText() === 'details?.result',
    );
    const notPicked = detailsBranch?.elseStatement;

    expect(callsTo(notPicked, 'clearPlace')).toHaveLength(1);
    expect(callsTo(notPicked, 'fullAddress.field.onChange').map((call) => call.arguments[0]?.getText())).toEqual([
      'suggestion.description.trim()',
    ]);
    expect(callsTo(notPicked, 'placeId.field.onChange')).toEqual([]);
  });

  test('writes the place of the suggestion once the details are found', () => {
    const detailsBranch = nodesOf(source, ts.isIfStatement).find(
      (statement) => statement.expression.getText() === 'details?.result',
    );
    const picked = callsTo(detailsBranch?.thenStatement, 'placeId.field.onChange');

    expect(picked.map((call) => call.arguments[0]?.getText())).toEqual(['suggestion.placeId.trim()']);
  });
});
