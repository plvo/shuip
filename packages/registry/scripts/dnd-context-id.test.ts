import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import { scanItems } from './generate';
import { attributeOrder, attributeValues, elementsNamed, parseTsx } from './jsx-source';

const contextsOf = (file: string) => {
  const source = parseTsx(file, fs.readFileSync(file, 'utf-8'));
  return {
    file,
    count: elementsNamed(source, 'DndContext').length,
    attributes: attributeOrder(source, 'DndContext'),
    ids: attributeValues(source, 'DndContext', 'id'),
  };
};

// dnd-kit numbers the contexts it renders with a counter that lives in the module, so a server that has rendered
// other pages hands out different numbers than a fresh browser and the page hydrates with a mismatch.
describe('the drag-and-drop contexts of the items', () => {
  const sources = scanItems().flatMap((item) => [
    item.componentPath,
    ...(item.componentOverridePath ? [item.componentOverridePath] : []),
  ]);
  const contexts = sources.map(contextsOf).filter(({ count }) => count > 0);

  test('are found in every source that renders one', () => {
    const rendering = sources.filter((file) => /<DndContext\b/.test(fs.readFileSync(file, 'utf-8')));

    expect(rendering.length).toBeGreaterThan(0);
    expect(new Set(contexts.map(({ file }) => file))).toEqual(new Set(rendering));
  });

  test('all carry an id of their own, not one passed along in a spread', () => {
    const withoutId = contexts.flatMap(({ file, attributes }) =>
      attributes.filter((names) => !names.includes('id')).map(() => file),
    );

    expect(withoutId).toEqual([]);
  });

  test('take that id from an expression, so that each instance can have its own', () => {
    const literal = contexts.flatMap(({ file, count, ids }) =>
      ids.length === count && ids.every((id) => !/^['"`]/.test(id)) ? [] : [file],
    );

    expect(literal).toEqual([]);
  });
});
