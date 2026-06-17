'use client';

import { createFormHook } from '@tanstack/react-form';
import { ComboboxField, type ComboboxOption } from '@/components/ui/shuip/tanstack-form/combobox-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';

const COUNTRIES: ComboboxOption[] = [
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'es', label: 'Spain' },
  { value: 'it', label: 'Italy' },
  { value: 'pt', label: 'Portugal' },
];

const PRESET: ComboboxOption = { value: 'fr', label: 'France' };

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { ComboboxField },
  formComponents: {},
});

export default function TsfComboboxFieldSizesExample() {
  const form = useAppForm({
    defaultValues: {
      small: 'fr',
      normal: 'fr',
    },
  });

  return (
    <form className='space-y-4'>
      <form.AppField
        name='small'
        children={(field) => (
          <field.ComboboxField
            size='sm'
            label='Small'
            placeholder='Search a country…'
            options={COUNTRIES}
            defaultSelected={PRESET}
          />
        )}
      />
      <form.AppField
        name='normal'
        children={(field) => (
          <field.ComboboxField
            size='default'
            label='Default'
            placeholder='Search a country…'
            options={COUNTRIES}
            defaultSelected={PRESET}
          />
        )}
      />
    </form>
  );
}
