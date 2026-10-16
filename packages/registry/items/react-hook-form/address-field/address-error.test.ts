import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { addressFieldError } from './component.base';

const ERROR_DECLARATIONS = ['ADDRESS_NOT_SELECTED_MESSAGE', 'AddressErrors', 'addressFieldError'];

const declaredName = (statement: ts.Statement): string | undefined => {
  if (ts.isVariableStatement(statement)) return statement.declarationList.declarations[0]?.name.getText();
  if (ts.isFunctionDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) return statement.name?.text;
  return undefined;
};

const errorDeclarations = (variant: 'radix' | 'base'): Record<string, string> => {
  const file = path.join(import.meta.dir, `component.${variant}.tsx`);
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf-8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  return Object.fromEntries(
    source.statements.flatMap((statement) => {
      const name = declaredName(statement);
      return name !== undefined && ERROR_DECLARATIONS.includes(name) ? [[name, statement.getText()]] : [];
    }),
  );
};

describe('addressFieldError', () => {
  test('reports nothing when no field has an error', () => {
    expect(addressFieldError({})).toBeUndefined();
    expect(addressFieldError({ fullAddress: undefined, street: undefined })).toBeUndefined();
  });

  test('reports the fullAddress error as it is', () => {
    const fullAddress = { message: 'Address is required' };

    expect(addressFieldError({ fullAddress })).toBe(fullAddress);
  });

  test('asks for a suggestion when one structured field has an error', () => {
    expect(addressFieldError({ postalCode: { message: 'Postal code is required' } })).toEqual({
      message: 'Select an address from the suggestions',
    });
  });

  test('asks for a suggestion once when several structured fields have an error', () => {
    const error = addressFieldError({
      street: { message: 'Street is required' },
      city: { message: 'City is required' },
      postalCode: { message: 'Postal code is required' },
      country: { message: 'Country is required' },
    });

    expect(error).toEqual({ message: 'Select an address from the suggestions' });
  });

  test('prefers the fullAddress error to the structured ones', () => {
    const fullAddress = { message: 'Address is required' };

    expect(addressFieldError({ fullAddress, street: { message: 'Street is required' } })).toBe(fullAddress);
  });
});

describe('the error selection shipped in both variants', () => {
  test('is the same code in the radix and base files', () => {
    const radix = errorDeclarations('radix');

    expect(Object.keys(radix).sort()).toEqual([...ERROR_DECLARATIONS].sort());
    expect(errorDeclarations('base')).toEqual(radix);
  });
});
