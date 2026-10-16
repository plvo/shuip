import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { attributeValues, elementsNamed, parseTsx } from './jsx-source';

const ITEM_DIR = path.resolve(import.meta.dir, '../items/components/confirmation-dialog');
const VARIANTS = ['radix', 'base'] as const;

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

const wrapperOf = (source: ts.SourceFile): ts.FunctionDeclaration | undefined =>
  source.statements.find(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === 'ConfirmationDialog',
  );

const declarationOf = (root: ts.Node | undefined, name: string): ts.VariableDeclaration | undefined =>
  root === undefined ? undefined : nodesOf(root, ts.isVariableDeclaration).find((d) => d.name.getText() === name);

const callsTo = (root: ts.Node | undefined, callee: string): ts.CallExpression[] =>
  root === undefined ? [] : nodesOf(root, ts.isCallExpression).filter((call) => call.expression.getText() === callee);

/** The properties of the object literal given as first argument of `call`, as name to source text. */
const objectArgument = (call: ts.CallExpression | undefined): Record<string, string> => {
  const [argument] = call?.arguments ?? [];
  if (argument === undefined || !ts.isObjectLiteralExpression(argument)) return {};
  return Object.fromEntries(
    argument.properties.flatMap((property) => {
      if (ts.isShorthandPropertyAssignment(property)) return [[property.name.getText(), property.name.getText()]];
      if (ts.isPropertyAssignment(property)) return [[property.name.getText(), property.initializer.getText()]];
      return [];
    }),
  );
};

const spreadsOf = (source: ts.SourceFile, tag: string): string[] =>
  elementsNamed(source, tag).flatMap((element) =>
    element.attributes.properties.flatMap((attribute) =>
      ts.isJsxSpreadAttribute(attribute) ? [attribute.expression.getText()] : [],
    ),
  );

describe.each(VARIANTS)('the ConfirmationDialog wrapper in the %s variant', (variant) => {
  const source = parse(variant);
  const wrapper = wrapperOf(source);
  const [confirmation] = callsTo(wrapper, 'runConfirmation');

  test('keeps its pending state in a useState pair', () => {
    const state = declarationOf(wrapper, '[pending, setPending]');

    expect(state?.initializer?.getText()).toBe('React.useState(false)');
  });

  test('runs the confirmation with its pending state, the caller handler and a setter of the pending state', () => {
    expect(callsTo(wrapper, 'runConfirmation')).toHaveLength(1);
    expect(objectArgument(confirmation)).toMatchObject({
      pending: 'pending',
      onConfirm: 'onConfirm',
      setPending: 'setPending',
    });
  });

  test('runs the confirmation when the view asks to confirm, and hands the view the pending state', () => {
    const [onConfirm] = attributeValues(source, 'ConfirmationDialogView', 'onConfirm');

    expect(attributeValues(source, 'ConfirmationDialogView', 'onConfirm')).toHaveLength(1);
    expect(onConfirm).toStartWith('() =>');
    expect(onConfirm).toContain('runConfirmation(');
    expect(attributeValues(source, 'ConfirmationDialogView', 'pending')).toEqual(['pending']);
  });

  test('forwards the other props to the view', () => {
    expect(spreadsOf(source, 'ConfirmationDialogView')).toEqual(['props']);
  });

  test('the view flags the confirm button disabled and busy from the pending state, keeping it focusable', () => {
    expect(attributeValues(source, 'Button', 'disabled')).toEqual([]);
    expect(attributeValues(source, 'Button', 'aria-disabled')).toEqual(['pending']);
    expect(attributeValues(source, 'Button', 'aria-busy')).toEqual(['pending']);
  });
});

describe('the ConfirmationDialog wrapper in the radix variant', () => {
  const source = parse('radix');
  const wrapper = wrapperOf(source);
  const [confirmation] = callsTo(wrapper, 'runConfirmation');

  test('closes by setting the open state to false', () => {
    expect(objectArgument(confirmation).close).toBe('() => setOpen(false)');
  });

  test('derives the open state and its setter from the open prop, its own state and onOpenChange', () => {
    const localState = declarationOf(wrapper, '[localOpen, setLocalOpen]');
    const resolved = declarationOf(wrapper, '{ open, setOpen }');

    expect(localState?.initializer?.getText()).toBe('React.useState(defaultOpen)');
    const [resolution, ...others] = callsTo(resolved?.initializer, 'resolveOpenState');

    expect(others).toEqual([]);
    expect(objectArgument(resolution)).toEqual({
      open: 'controlledOpen',
      localOpen: 'localOpen',
      setLocalOpen: 'setLocalOpen',
      onOpenChange: 'onOpenChange',
    });
  });

  test('hands the view the resolved open state and the setter that notifies the caller', () => {
    expect(attributeValues(source, 'ConfirmationDialogView', 'open')).toEqual(['open']);
    expect(attributeValues(source, 'ConfirmationDialogView', 'onOpenChange')).toEqual(['setOpen']);
  });

  test('the view hands both to the Dialog root', () => {
    expect(attributeValues(source, 'Dialog', 'open')).toEqual(['open']);
    expect(attributeValues(source, 'Dialog', 'onOpenChange')).toEqual(['onOpenChange']);
  });
});

describe('the ConfirmationDialog wrapper in the base variant', () => {
  const source = parse('base');
  const wrapper = wrapperOf(source);
  const [confirmation] = callsTo(wrapper, 'runConfirmation');

  test('creates one actionsRef and closes the dialog through it', () => {
    expect(declarationOf(wrapper, 'actionsRef')?.initializer?.getText()).toBe('React.useRef(null)');
    expect(objectArgument(confirmation).close).toBe('() => actionsRef.current?.close()');
  });

  test('hands that actionsRef to the view, which hands it to the Dialog root', () => {
    expect(attributeValues(source, 'ConfirmationDialogView', 'actionsRef')).toEqual(['actionsRef']);
    expect(attributeValues(source, 'Dialog', 'actionsRef')).toEqual(['actionsRef']);
  });
});

describe('the async-error example', () => {
  const file = path.join(ITEM_DIR, 'async-error.example.radix.tsx');
  const source = parseTsx(file, fs.readFileSync(file, 'utf-8'));

  test('clears its error on every change of the open state, so a late rejection cannot leak into the next opening', () => {
    expect(attributeValues(source, 'ConfirmationDialog', 'onOpenChange')).toEqual(['() => setError(undefined)']);
  });
});
