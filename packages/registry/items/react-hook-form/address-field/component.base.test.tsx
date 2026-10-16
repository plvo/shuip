import { describe, expect, test } from 'bun:test';
import { useLens } from '@hookform/lenses';
import { renderToStaticMarkup } from 'react-dom/server';
import { useForm } from 'react-hook-form';
import { firstElementAttributes } from '../../../scripts/markup';
import { type AddressData, AddressField } from './component.base';

const EMPTY_ADDRESS: AddressData = { street: '', city: '', postalCode: '', country: '', fullAddress: '' };

function Subject() {
  const form = useForm({ defaultValues: { address: EMPTY_ADDRESS } });
  const lens = useLens({ control: form.control });
  return <AddressField lens={lens.focus('address')} label='Address' />;
}

describe('AddressField closed state', () => {
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
    expect(firstElementAttributes(markup, 'label').for).toBe('address.fullAddress');
    expect(input.id).toBe('address.fullAddress');
  });

  test('leaves no popup trigger attribute on the markup around the input', () => {
    expect(markup).not.toContain('aria-haspopup');
  });
});
