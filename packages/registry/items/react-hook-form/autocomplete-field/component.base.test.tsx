import { describe, expect, test } from 'bun:test';
import { useLens } from '@hookform/lenses';
import { renderToStaticMarkup } from 'react-dom/server';
import { useForm } from 'react-hook-form';
import { firstElementAttributes } from '../../../scripts/markup';
import { labelId } from '../../components/suggestion-list/component.radix';
import { AutocompleteField } from './component.base';

function Subject() {
  const form = useForm({ defaultValues: { source: '' } });
  const lens = useLens({ control: form.control });
  return <AutocompleteField lens={lens.focus('source')} label='Source' suggestions={['LinkedIn', 'Referral']} />;
}

describe('AutocompleteField closed state', () => {
  const markup = renderToStaticMarkup(<Subject />);
  const input = firstElementAttributes(markup, 'input');

  test('exposes the input as a combobox with a collapsed list', () => {
    expect(input.role).toBe('combobox');
    expect(input['aria-autocomplete']).toBe('list');
    expect(input['aria-expanded']).toBe('false');
  });

  test('points to no list and no option while closed', () => {
    expect(input['aria-controls']).toBeUndefined();
    expect(input['aria-activedescendant']).toBeUndefined();
  });

  test('keeps the label bound to the input', () => {
    expect(firstElementAttributes(markup, 'label').for).toBe('source');
    expect(firstElementAttributes(markup, 'label').id).toBe(labelId('source'));
    expect(input.id).toBe('source');
  });
});
