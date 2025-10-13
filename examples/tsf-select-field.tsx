'use client';

import { useForm } from '@tanstack/react-form';
import { SelectField } from '#/registry/ui/tsf-select-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfSelectFieldExample() {
  const form = useForm({
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
      <SelectField
        form={form}
        name='country'
        options={{
          'United States': 'us',
          'United Kingdom': 'uk',
          France: 'fr',
          Germany: 'de',
        }}
        label='Country'
        placeholder='Select a country'
        description='Choose your country'
        formProps={{
          validators: {
            onChange: ({ value }) => (!value ? 'Please select a country' : undefined),
          },
        }}
      />

      <SubmitButton form={form} type='submit' />
    </form>
  );
}
