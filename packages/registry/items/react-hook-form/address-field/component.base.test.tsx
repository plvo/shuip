import { describe, expect, test } from 'bun:test';
import { useLens } from '@hookform/lenses';
import { renderToStaticMarkup } from 'react-dom/server';
import { useForm } from 'react-hook-form';
import { firstElementAttributes } from '../../../scripts/markup';
import { labelId } from '../../components/suggestion-list/component.radix';
import { type AddressData, AddressField, addressFieldError, clearFilledFields } from './component.base';

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
    expect(firstElementAttributes(markup, 'label').id).toBe(labelId('address.fullAddress'));
    expect(input.id).toBe('address.fullAddress');
  });

  test('marks the pristine input as valid', () => {
    expect(input['aria-invalid']).toBe('false');
  });

  test('leaves no popup trigger attribute on the markup around the input', () => {
    expect(markup).not.toContain('aria-haspopup');
  });
});

describe('addressFieldError', () => {
  const NOT_SELECTED = { message: 'Select an address from the suggestions' };

  test('reports nothing when no field has an error', () => {
    expect(addressFieldError({})).toBeUndefined();
    expect(addressFieldError({ fullAddress: undefined, street: undefined })).toBeUndefined();
  });

  test('reports the fullAddress error as it is', () => {
    const fullAddress = { message: 'Address is required' };

    expect(addressFieldError({ fullAddress })).toBe(fullAddress);
  });

  test.each([
    'street',
    'city',
    'postalCode',
    'country',
  ] as const)('asks for a suggestion when only %s has an error', (name) => {
    expect(addressFieldError({ [name]: { message: `${name} is required` } })).toEqual(NOT_SELECTED);
  });

  test('asks for a suggestion once when several structured fields have an error', () => {
    const error = addressFieldError({
      street: { message: 'Street is required' },
      city: { message: 'City is required' },
      postalCode: { message: 'Postal code is required' },
      country: { message: 'Country is required' },
    });

    expect(error).toEqual(NOT_SELECTED);
  });

  test('prefers the fullAddress error to the structured ones', () => {
    const fullAddress = { message: 'Address is required' };

    expect(addressFieldError({ fullAddress, street: { message: 'Street is required' } })).toBe(fullAddress);
  });
});

describe('clearFilledFields', () => {
  const controller = (value: string | undefined) => {
    const changes: string[] = [];
    return { changes, field: { value, onChange: (next: string) => changes.push(next) } };
  };

  test('empties the fields that hold a value', () => {
    const street = controller('1 Main St');
    const placeId = controller('abc');

    clearFilledFields([street, placeId]);

    expect(street.changes).toEqual(['']);
    expect(placeId.changes).toEqual(['']);
  });

  test('leaves the fields that are already empty untouched', () => {
    const city = controller('');
    const country = controller(undefined);

    clearFilledFields([city, country]);

    expect(city.changes).toEqual([]);
    expect(country.changes).toEqual([]);
  });
});
