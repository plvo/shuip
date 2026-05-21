'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SelectField } from '@/components/ui/shuip/tanstack-form/select-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { SelectField },
  formComponents: { SubmitButton },
});

export default function TsfSelectFieldExample() {
  const form = useAppForm({
    defaultValues: {
      country: '',
    },

    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
          onChange: ({ value }) => (!value ? 'Please select a country' : undefined),
        }}
        children={(field) => (
          <field.SelectField
            options={{
              'United States': 'us',
              'United Kingdom': 'uk',
              France: 'fr',
              Germany: 'de',
            }}
            label='Country'
            placeholder='Select a country'
            description='Choose your country'
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton />
      </form.AppForm>
    </form>
  );
}
