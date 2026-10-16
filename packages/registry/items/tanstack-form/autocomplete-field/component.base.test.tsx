import { describe, expect, test } from 'bun:test';
import { createFormHook } from '@tanstack/react-form';
import { renderToStaticMarkup } from 'react-dom/server';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { firstElementAttributes } from '../../../scripts/markup';
import { AutocompleteField } from './component.base';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { AutocompleteField },
  formComponents: {},
});

function Subject() {
  const form = useAppForm({ defaultValues: { source: '' } });
  return (
    <form.AppField
      name='source'
      children={(field) => <field.AutocompleteField label='Source' suggestions={['LinkedIn', 'Referral']} />}
    />
  );
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
    expect(input.id).toBe('source');
  });
});
