import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { scanItems } from './generate';
import { elementsNamed, parseTsx } from './jsx-source';

const hasId = (element: ts.JsxOpeningElement | ts.JsxSelfClosingElement) =>
  element.attributes.properties.some((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText() === 'id');

const dndContextsOf = (file: string) =>
  elementsNamed(parseTsx(file, fs.readFileSync(file, 'utf-8')), 'DndContext').map((element) => ({
    file: path.basename(path.dirname(file)),
    hasId: hasId(element),
  }));

// dnd-kit numbers the contexts it renders with a counter that lives in the module, so a server that has rendered
// other pages hands out different numbers than a fresh browser and the page hydrates with a mismatch.
describe('the drag-and-drop contexts of the items', () => {
  const sources = scanItems().flatMap((item) => [
    item.componentPath,
    ...(item.componentOverridePath ? [item.componentOverridePath] : []),
  ]);
  const contexts = sources.flatMap(dndContextsOf);

  test('are found in every source that renders one', () => {
    const rendering = sources.filter((file) => /<DndContext\b/.test(fs.readFileSync(file, 'utf-8')));

    expect(rendering.length).toBeGreaterThan(0);
    expect(new Set(contexts.map(({ file }) => file))).toEqual(
      new Set(rendering.map((file) => path.basename(path.dirname(file)))),
    );
  });

  test('all carry an id', () => {
    expect(contexts.filter(({ hasId: carriesId }) => !carriesId)).toEqual([]);
  });
});
