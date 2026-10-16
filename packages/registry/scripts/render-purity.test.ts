import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { scanItems } from './generate';
import { parseTsx } from './jsx-source';

const REPO_ROOT = path.resolve(import.meta.dir, '../../..');

type FunctionNode = ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration | ts.MethodDeclaration;

const isFunction = (node: ts.Node): node is FunctionNode =>
  ts.isArrowFunction(node) ||
  ts.isFunctionExpression(node) ||
  ts.isFunctionDeclaration(node) ||
  ts.isMethodDeclaration(node);

/** React calls these arguments while it renders: the position of each function argument, per callee. */
const RENDER_TIME_ARGUMENTS: Record<string, number[]> = {
  useMemo: [0],
  useState: [0],
  useReducer: [0, 2],
  useSyncExternalStore: [1, 2],
  forwardRef: [0],
  memo: [0],
};

const calleeName = (call: ts.CallExpression): string | undefined => {
  if (ts.isIdentifier(call.expression)) return call.expression.text;
  if (ts.isPropertyAccessExpression(call.expression)) return call.expression.name.text;
  return undefined;
};

const isCurrentAccess = (node: ts.Node): node is ts.PropertyAccessExpression | ts.ElementAccessExpression =>
  (ts.isPropertyAccessExpression(node) && node.name.text === 'current') ||
  (ts.isElementAccessExpression(node) &&
    ts.isStringLiteral(node.argumentExpression) &&
    node.argumentExpression.text === 'current');

const LAZY_INITIALISATION_OPERATORS = [ts.SyntaxKind.QuestionQuestionEqualsToken, ts.SyntaxKind.BarBarEqualsToken];

const isUpdateOperator = (operator: ts.SyntaxKind): boolean =>
  operator === ts.SyntaxKind.PlusPlusToken || operator === ts.SyntaxKind.MinusMinusToken;

/** The `x.current` that the node assigns, increments or decrements, if any. */
const writtenRef = (node: ts.Node): ts.Expression | undefined => {
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
    !LAZY_INITIALISATION_OPERATORS.includes(node.operatorToken.kind)
  ) {
    return isCurrentAccess(node.left) ? node.left : undefined;
  }
  if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && isUpdateOperator(node.operator)) {
    return isCurrentAccess(node.operand) ? node.operand : undefined;
  }
  return undefined;
};

const isNullish = (node: ts.Expression): boolean =>
  node.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(node) && node.text === 'undefined');

/** `ref.current === null`, `ref.current == undefined` or `!ref.current`. */
const isEmptyCheck = (condition: ts.Expression, ref: string, source: ts.SourceFile): boolean => {
  if (ts.isPrefixUnaryExpression(condition) && condition.operator === ts.SyntaxKind.ExclamationToken) {
    return condition.operand.getText(source) === ref;
  }
  if (!ts.isBinaryExpression(condition)) return false;
  const equality = [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken];
  if (!equality.includes(condition.operatorToken.kind)) return false;
  return (
    (condition.left.getText(source) === ref && isNullish(condition.right)) ||
    (condition.right.getText(source) === ref && isNullish(condition.left))
  );
};

/** The write runs only while `ref.current` is empty: React allows that lazy initialisation during render. */
const isGuardedInitialisation = (write: ts.Node, ref: ts.Expression, source: ts.SourceFile): boolean => {
  for (
    let child: ts.Node = write, parent = write.parent;
    parent && !isFunction(parent);
    child = parent, parent = parent.parent
  ) {
    if (ts.isIfStatement(parent) && parent.thenStatement === child) {
      return isEmptyCheck(parent.expression, ref.getText(source), source);
    }
  }
  return false;
};

const isComponentName = (name: string): boolean => /^[A-Z]/.test(name);

/** A function React runs while rendering: a component, a hook, or a callback a hook runs during render. */
const rendersWhenCalled = (fn: FunctionNode): boolean => {
  const { parent } = fn;
  if (ts.isFunctionDeclaration(fn)) return !fn.name || isComponentName(fn.name.text) || !isInsideFunction(fn);
  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name) && isComponentName(parent.name.text))
    return true;
  if (ts.isCallExpression(parent)) {
    const positions = RENDER_TIME_ARGUMENTS[calleeName(parent) ?? ''];
    return positions?.some((position) => parent.arguments[position] === fn) ?? false;
  }
  return !isInsideFunction(fn);
};

const isInsideFunction = (node: ts.Node): boolean => {
  for (let parent = node.parent; parent; parent = parent.parent) if (isFunction(parent)) return true;
  return false;
};

const enclosingFunction = (node: ts.Node): FunctionNode | undefined => {
  for (let parent = node.parent; parent; parent = parent.parent) if (isFunction(parent)) return parent;
  return undefined;
};

interface RefWrite {
  file: string;
  line: number;
  text: string;
}

/** Every write to an `x.current` of a source that runs while a component or hook renders. */
const renderTimeRefWrites = (file: string, content: string): RefWrite[] => {
  const source = parseTsx(file, content);
  const found: RefWrite[] = [];
  const visit = (node: ts.Node) => {
    const ref = writtenRef(node);
    const fn = ref && enclosingFunction(node);
    if (ref && fn && rendersWhenCalled(fn) && !isGuardedInitialisation(node, ref, source)) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
      found.push({ file, line: line + 1, text: node.getText(source) });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

const writesIn = (content: string): string[] => renderTimeRefWrites('fixture.tsx', content).map((write) => write.text);

describe('renderTimeRefWrites', () => {
  const inComponent = (body: string) => `export function Box() {\n${body}\nreturn null;\n}`;

  test.each([
    ['the component body', inComponent('ref.current = value;')],
    ['a useMemo initializer', inComponent('const v = React.useMemo(() => { ref.current = a; return a; }, [a]);')],
    ['a useState initializer', inComponent('const [v] = useState(() => { ref.current = a; return a; });')],
    [
      'a useReducer initializer',
      inComponent('const [v] = useReducer(reduce, a, (init) => { ref.current = init; return init; });'),
    ],
    [
      'a useSyncExternalStore snapshot',
      inComponent('const v = useSyncExternalStore(sub, () => { ref.current = 1; return 1; });'),
    ],
    ['a component declared inside a function', inComponent('const Row = () => { ref.current = value; return null; };')],
    ['a postfix increment', inComponent('requestIdRef.current++;')],
    ['a prefix increment', inComponent('++requestIdRef.current;')],
    ['a prefix decrement', inComponent('--requestIdRef.current;')],
    ['a compound assignment', inComponent('countRef.current += 1;')],
    ['a guard on another condition', inComponent('if (enabled) ref.current = value;')],
  ])('flags a write in %s', (_name, content) => {
    expect(writesIn(content)).toHaveLength(1);
  });

  test.each([
    ['an effect', inComponent('React.useEffect(() => { ref.current = value; });')],
    ['a layout effect', inComponent('React.useLayoutEffect(() => { ref.current = value; }, []);')],
    ['an event handler', inComponent('const onClick = () => { ref.current = value; };')],
    ['a useCallback', inComponent('const run = React.useCallback(() => { ref.current++; }, []);')],
    ['a ref callback', inComponent('const el = <div ref={(node) => { ref.current = node; }} />;')],
    [
      'a useSyncExternalStore subscription',
      inComponent('useSyncExternalStore((cb) => { ref.current = cb; return () => {}; }, snap);'),
    ],
    ['a lazy initialisation with ??=', inComponent('ref.current ??= new Map();')],
    ['a lazy initialisation with ||=', inComponent('ref.current ||= new Map();')],
    ['a lazy initialisation guarded by null', inComponent('if (ref.current === null) ref.current = new Map();')],
    [
      'a lazy initialisation guarded by undefined',
      inComponent('if (ref.current === undefined) { ref.current = new Map(); }'),
    ],
    ['a lazy initialisation guarded by negation', inComponent('if (!ref.current) ref.current = new Map();')],
  ])('accepts a write in %s', (_name, content) => {
    expect(writesIn(content)).toEqual([]);
  });

  test('reports the file, the line and the text of the write', () => {
    expect(renderTimeRefWrites('a.tsx', inComponent('ref.current = value;'))).toEqual([
      { file: 'a.tsx', line: 2, text: 'ref.current = value' },
    ]);
  });
});

interface KnownWrite {
  file: string;
  text: string;
}

/** Writes that still happen while rendering, each matching one write of the source. Remove the entry when fixed. */
const KNOWN_RENDER_TIME_WRITES: KnownWrite[] = [];

const relativeToRepo = (file: string): string => path.relative(REPO_ROOT, file).split(path.sep).join('/');

const sources = scanItems().flatMap((item) => [
  item.componentPath,
  ...(item.componentOverridePath ? [item.componentOverridePath] : []),
  ...item.examples.flatMap((example) => [example.absPath, ...(example.overridePath ? [example.overridePath] : [])]),
]);

const writes = sources.flatMap((file) => renderTimeRefWrites(relativeToRepo(file), fs.readFileSync(file, 'utf-8')));

const describeWrite = ({ file, line, text }: RefWrite) => `${file}:${line} ${text}`;

describe('render purity of the registry sources', () => {
  test('scans the canonical sources, the Base UI overrides and the examples', () => {
    const scanned = sources.map(relativeToRepo);
    expect(scanned).toContain('packages/registry/items/blocks/data-table/component.radix.tsx');
    expect(scanned.some((file) => file.endsWith('.base.tsx'))).toBe(true);
    expect(scanned.some((file) => file.endsWith('.example.radix.tsx'))).toBe(true);
  });

  test('no ref is written while a component renders', () => {
    const unexpected = [...writes];
    for (const known of KNOWN_RENDER_TIME_WRITES) {
      const index = unexpected.findIndex((write) => write.file === known.file && write.text === known.text);
      if (index >= 0) unexpected.splice(index, 1);
    }
    expect(unexpected.map(describeWrite)).toEqual([]);
  });

  test('every known render-time write is still in its source', () => {
    const stale = KNOWN_RENDER_TIME_WRITES.filter(
      (known) => !writes.some((write) => write.file === known.file && write.text === known.text),
    );
    expect(stale.map((known) => `${known.file} ${known.text}`)).toEqual([]);
  });
});
