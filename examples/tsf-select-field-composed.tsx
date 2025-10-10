'use client';

import { TanstackForm, useAppForm } from '#/registry/hooks/tsf-context';

export default function TsfSelectFieldComposedExample() {
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
    <TanstackForm form={form} className='space-y-4'>
      <form.AppField
        name='country'
        validators={{
          onChange: ({ value }) => (!value ? 'Please select a country' : undefined),
        }}
      >
        {(field) => (
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
      </form.AppField>

      <form.SubmitButton>Submit</form.SubmitButton>
    </TanstackForm>
  );
}
