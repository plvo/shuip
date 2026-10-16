import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { firstElementAttributes } from '../../../scripts/markup';
import {
  activeOptionId,
  labelId,
  listboxId,
  listboxName,
  optionId,
  SuggestionEmpty,
  SuggestionOption,
  useSuggestionList,
} from './component.radix';

describe('ids derived from the input id', () => {
  test('name the label, the listbox and each option', () => {
    expect(labelId('city')).toBe('city-label');
    expect(listboxId('city')).toBe('city-listbox');
    expect(optionId('city', 2)).toBe('city-listbox-option-2');
  });
});

describe('activeOptionId', () => {
  const state = { inputId: 'city', open: true, selectedIndex: 1, count: 3 };

  test('names the highlighted option', () => {
    expect(activeOptionId(state)).toBe('city-listbox-option-1');
  });

  test('is absent while the list is closed', () => {
    expect(activeOptionId({ ...state, open: false })).toBeUndefined();
  });

  test('is absent when nothing is highlighted', () => {
    expect(activeOptionId({ ...state, selectedIndex: -1 })).toBeUndefined();
  });

  test('is absent when the highlight is past the last option', () => {
    expect(activeOptionId({ ...state, selectedIndex: 3 })).toBeUndefined();
    expect(activeOptionId({ ...state, selectedIndex: 2 })).toBe('city-listbox-option-2');
  });

  test('is absent when the list has no option', () => {
    expect(activeOptionId({ ...state, selectedIndex: 0, count: 0 })).toBeUndefined();
  });
});

describe('listboxName', () => {
  test('points to the field label when there is one', () => {
    expect(listboxName({ inputId: 'city', label: 'City', ariaLabel: 'Town', placeholder: 'Where' })).toEqual({
      'aria-labelledby': 'city-label',
    });
  });

  test('falls back to the input aria-label without a label', () => {
    expect(listboxName({ inputId: 'city', ariaLabel: 'Town', placeholder: 'Where' })).toEqual({ 'aria-label': 'Town' });
  });

  test('falls back to the placeholder without a label or an aria-label', () => {
    expect(listboxName({ inputId: 'city', placeholder: 'Where' })).toEqual({ 'aria-label': 'Where' });
  });

  test('has no name when nothing can provide one', () => {
    expect(listboxName({ inputId: 'city' })).toEqual({ 'aria-label': undefined });
  });
});

describe('useSuggestionList', () => {
  const Subject = ({ open, selectedIndex }: { open: boolean; selectedIndex: number }) => {
    const list = useSuggestionList({ inputId: 'city', label: 'City', open, selectedIndex, count: 2, busy: true });
    return createElement(
      'section',
      null,
      createElement('input', { id: 'city', ...list.inputProps }),
      createElement('div', { ...list.listboxProps }),
    );
  };
  const render = (props: { open: boolean; selectedIndex: number }) =>
    renderToStaticMarkup(createElement(Subject, props));

  test('describes a closed combobox', () => {
    const input = firstElementAttributes(render({ open: false, selectedIndex: -1 }), 'input');

    expect(input.role).toBe('combobox');
    expect(input['aria-autocomplete']).toBe('list');
    expect(input['aria-expanded']).toBe('false');
    expect(input['aria-controls']).toBeUndefined();
    expect(input['aria-activedescendant']).toBeUndefined();
  });

  test('describes an open combobox that controls the listbox and points to the highlighted option', () => {
    const markup = render({ open: true, selectedIndex: 1 });
    const input = firstElementAttributes(markup, 'input');
    const listbox = firstElementAttributes(markup, 'div');

    expect(input['aria-expanded']).toBe('true');
    expect(input['aria-controls']).toBe(listbox.id);
    expect(input['aria-activedescendant']).toBe('city-listbox-option-1');
    expect(listbox.role).toBe('listbox');
    expect(listbox['aria-labelledby']).toBe('city-label');
    expect(listbox['aria-busy']).toBe('true');
  });
});

describe('options', () => {
  test('mark the highlighted option as selected and every other as not selected', () => {
    const option = (highlighted: boolean) =>
      firstElementAttributes(
        renderToStaticMarkup(
          createElement(SuggestionOption, { id: 'a', highlighted, onSelect: () => {}, onHighlight: () => {} }, 'A'),
        ),
        'div',
      );

    expect(option(true)['aria-selected']).toBe('true');
    expect(option(false)['aria-selected']).toBe('false');
    expect(option(true).role).toBe('option');
  });

  test('keep the empty message an unavailable option so the listbox always has one', () => {
    const empty = firstElementAttributes(
      renderToStaticMarkup(createElement(SuggestionEmpty, null, 'No results')),
      'div',
    );

    expect(empty.role).toBe('option');
    expect(empty['aria-disabled']).toBe('true');
    expect(empty['aria-selected']).toBe('false');
  });
});
