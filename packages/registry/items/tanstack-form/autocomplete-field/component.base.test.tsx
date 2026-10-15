import { describe, expect, test } from 'bun:test';
import { createFormHook } from '@tanstack/react-form';
import { renderToStaticMarkup } from 'react-dom/server';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
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
    expect(markup).toContain('for="source"');
    expect(markup).toContain('id="source"');
  });
});
