import { describe, expect, test } from 'bun:test';
import { useLens } from '@hookform/lenses';
import { renderToStaticMarkup } from 'react-dom/server';
import { useForm } from 'react-hook-form';
import { type AddressData, AddressField } from './component.base';

const EMPTY_ADDRESS: AddressData = { street: '', city: '', postalCode: '', country: '', fullAddress: '' };

function Subject() {
  const form = useForm({ defaultValues: { address: EMPTY_ADDRESS } });
  const lens = useLens({ control: form.control });
  return <AddressField lens={lens.focus('address')} label='Address' />;
}

describe('AddressField closed state', () => {
  const markup = renderToStaticMarkup(<Subject />);

  test('exposes the input as a combobox with a collapsed list', () => {
    expect(markup).toContain('role="combobox"');
    expect(markup).toContain('aria-autocomplete="list"');
    expect(markup).toContain('aria-expanded="false"');
  });

  test('points to no list and no option while closed', () => {
    expect(markup).not.toContain('aria-controls');
    expect(markup).not.toContain('aria-activedescendant');
  });

  test('keeps the label bound to the input', () => {
    expect(markup).toContain('for="address.fullAddress"');
    expect(markup).toContain('id="address.fullAddress"');
  });

  test('leaves no popup trigger attribute on the input wrapper', () => {
    expect(markup).not.toContain('aria-haspopup');
  });
});
