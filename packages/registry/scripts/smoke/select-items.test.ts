import { describe, expect, test } from 'bun:test';
import { selectItems } from './select-items';
import { StepFailure } from './step';

describe('selectItems', () => {
  const published = ['search-input', 'side-dialog', 'tsf-input-field'];

  test('keeps every published item when none is requested', () => {
    expect(selectItems(published, undefined)).toEqual(published);
  });

  test('restricts to the requested items', () => {
    expect(selectItems(published, ['search-input'])).toEqual(['search-input']);
  });

  test('names the requested items that are not published', () => {
    let failure: unknown;
    try {
      selectItems(published, ['search-input', 'search-inpt']);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(StepFailure);
    expect((failure as StepFailure).output).toContain('search-inpt');
  });
});
