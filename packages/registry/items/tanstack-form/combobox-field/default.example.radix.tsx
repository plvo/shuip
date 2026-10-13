'use client';

import { createFormHook } from '@tanstack/react-form';
import { ComboboxField, type ComboboxOption } from '@/components/ui/shuip/tanstack-form/combobox-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const COUNTRIES: ComboboxOption[] = [
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'es', label: 'Spain' },
  { value: 'it', label: 'Italy' },
  { value: 'pt', label: 'Portugal' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'be', label: 'Belgium' },
];

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { ComboboxField },
  formComponents: { SubmitButton },
});

export default function TsfComboboxFieldExample() {
  const form = useAppForm({
    defaultValues: {
      country: 'fr',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <form.AppField
        name='country'
        validators={{
          onChange: ({ value }) => (value.length === 0 ? 'Country is required' : undefined),
        }}
        children={(field) => (
          <field.ComboboxField
            label='Country'
            description='The preset value resolves its label at rest'
            placeholder='Search a country…'
            options={COUNTRIES}
            defaultSelected={{ value: 'fr', label: 'France' }}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Submit</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
