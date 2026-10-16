import { describe, expect, mock, spyOn, test } from 'bun:test';
import { useLens } from '@hookform/lenses';
import { renderToStaticMarkup } from 'react-dom/server';
import { useForm } from 'react-hook-form';
import { firstElementAttributes } from '../../../scripts/markup';
import { labelId } from '../../components/suggestion-list/component.radix';
import {
  type AddressData,
  AddressField,
  addressFieldError,
  clearFilledFields,
  handElementToFields,
  lookupPlaceDetails,
} from './component.base';

const EMPTY_ADDRESS: AddressData = { street: '', city: '', postalCode: '', country: '', fullAddress: '' };

function Subject({ describedBy }: { describedBy?: string }) {
  const form = useForm({ defaultValues: { address: EMPTY_ADDRESS } });
  const lens = useLens({ control: form.control });
  return <AddressField lens={lens.focus('address')} label='Address' aria-describedby={describedBy} />;
}

function InvalidSubject({ describedBy }: { describedBy?: string }) {
  const form = useForm({
    defaultValues: { address: EMPTY_ADDRESS },
    errors: { address: { street: { type: 'required', message: 'Street is required' } } },
  });
  const lens = useLens({ control: form.control });
  return <AddressField lens={lens.focus('address')} label='Address' aria-describedby={describedBy} />;
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

describe('AddressField with a structured error', () => {
  const errorTag = (markup: string) => markup.match(/<div\b[^>]*data-slot="field-error"[^>]*>/)?.[0] ?? '';
  const errorId = (markup: string) => errorTag(markup).match(/\bid="([^"]*)"/)?.[1];

  test('marks the input invalid and describes it by the one error it shows', () => {
    const markup = renderToStaticMarkup(<InvalidSubject />);
    const input = firstElementAttributes(markup, 'input');

    expect(input['aria-invalid']).toBe('true');
    expect(errorId(markup)).toBeDefined();
    expect(input['aria-describedby']).toBe(errorId(markup));
    expect(markup).toContain('Select an address from the suggestions');
  });

  test('keeps the description the caller gave the input', () => {
    const markup = renderToStaticMarkup(<InvalidSubject describedBy='hint' />);

    expect(firstElementAttributes(markup, 'input')['aria-describedby']).toBe(`hint ${errorId(markup)}`);
  });

  test('leaves the caller description alone while the field is valid', () => {
    const markup = renderToStaticMarkup(<Subject describedBy='hint' />);

    expect(firstElementAttributes(markup, 'input')['aria-describedby']).toBe('hint');
  });
});

describe('lookupPlaceDetails', () => {
  test('returns what the lookup resolves to', async () => {
    const details = { result: { formatted_address: '1 Main St' } };

    expect(await lookupPlaceDetails(() => Promise.resolve(details))).toBe(details);
  });

  test('hands the details of a lookup that found nothing to the caller as they are', async () => {
    const empty = { error: 'Google Places API error: NOT_FOUND' };

    expect(await lookupPlaceDetails(() => Promise.resolve(empty))).toBe(empty);
  });

  test('answers undefined and logs when the lookup rejects', async () => {
    const logged = spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new TypeError('Failed to fetch');

    try {
      expect(await lookupPlaceDetails(() => Promise.reject(failure))).toBeUndefined();
      expect(logged).toHaveBeenCalledWith('Error fetching place details:', failure);
    } finally {
      logged.mockRestore();
    }
  });
});

describe('handElementToFields', () => {
  const controllers = () => [mock(), mock(), mock()].map((ref) => ({ ref, field: { ref } }));

  test('gives the element to the ref of every controller', () => {
    const input = {} as HTMLInputElement;
    const targets = controllers();

    handElementToFields(targets, input);

    for (const { ref } of targets) expect(ref).toHaveBeenCalledWith(input);
  });

  test('tells every controller when the element goes away', () => {
    const targets = controllers();

    handElementToFields(targets, null);

    for (const { ref } of targets) expect(ref).toHaveBeenCalledWith(null);
  });
});
