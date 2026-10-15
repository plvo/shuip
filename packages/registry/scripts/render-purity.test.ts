import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { scanItems } from './generate';

const REPO_ROOT = path.resolve(import.meta.dir, '../../..');

const isFunction = (node: ts.Node): boolean =>
  ts.isArrowFunction(node) ||
  ts.isFunctionExpression(node) ||
  ts.isFunctionDeclaration(node) ||
  ts.isMethodDeclaration(node);

const isRefWrite = (node: ts.Node): node is ts.BinaryExpression =>
  ts.isBinaryExpression(node) &&
  node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
  node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
  node.operatorToken.kind !== ts.SyntaxKind.QuestionQuestionEqualsToken &&
  ((ts.isPropertyAccessExpression(node.left) && node.left.name.text === 'current') ||
    (ts.isElementAccessExpression(node.left) &&
      ts.isStringLiteral(node.left.argumentExpression) &&
      node.left.argumentExpression.text === 'current'));

/** A function declared inside another one: an effect, an event handler or a ref callback, never a render. */
const isInsideNestedFunction = (node: ts.Node): boolean => {
  let depth = 0;
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (isFunction(parent)) depth += 1;
  }
  return depth >= 2;
};

/** The `file:line` of every `x.current = …` that runs while a component or hook renders. */
const renderTimeRefWrites = (file: string): string[] => {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf-8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (isRefWrite(node) && !isInsideNestedFunction(node)) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
      found.push(`${path.relative(REPO_ROOT, file).split(path.sep).join('/')}:${line + 1}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

/** Sources that still write a ref while rendering, with how many writes they hold. Remove the entry when fixed. */
const KNOWN_RENDER_TIME_WRITES: Record<string, number> = {
  'packages/registry/items/react-hook-form/combobox-field/component.radix.tsx': 1,
  'packages/registry/items/tanstack-form/combobox-field/component.radix.tsx': 1,
};

const sources = scanItems().flatMap((item) => [item.componentPath, ...item.examples.map((example) => example.absPath)]);
const writes = sources.flatMap(renderTimeRefWrites).map((write) => {
  const [file, line] = write.split(':');
  return { file, line, write };
});

describe('render purity of the canonical sources', () => {
  test('scans the registry sources', () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  test('no ref is written while a component renders', () => {
    const unexpected = writes.filter(({ file }) => !(file in KNOWN_RENDER_TIME_WRITES)).map(({ write }) => write);
    expect(unexpected).toEqual([]);
  });

  test('the known render-time writes are still there', () => {
    for (const [file, count] of Object.entries(KNOWN_RENDER_TIME_WRITES)) {
      expect(writes.filter((entry) => entry.file === file)).toHaveLength(count);
    }
  });
});
