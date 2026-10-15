import { describe, expect, test } from 'bun:test';
import { COMPONENT_CATEGORIES, categoryOf } from './component-categories';

describe('categoryOf', () => {
  test('puts the pages directly under the section in the components category', () => {
    expect(categoryOf(['side-dialog'])).toBe('components');
  });

  test('names the other categories after the first slug', () => {
    expect(categoryOf(['react-hook-form', 'input-field'])).toBe('react-hook-form');
  });

  test.each(COMPONENT_CATEGORIES.filter(({ hasGuide }) => hasGuide))('$id has a guide at its own slug', ({ id }) => {
    expect(categoryOf([id, 'item'])).toBe(id);
  });
});
