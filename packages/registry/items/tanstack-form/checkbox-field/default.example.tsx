'use client';

import { createFormHook } from '@tanstack/react-form';
import { CheckboxField } from '@/components/ui/shuip/tanstack-form/checkbox-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { CheckboxField },
  formComponents: { SubmitButton },
});

export default function TsfCheckboxFieldExample() {
  const form = useAppForm({
    defaultValues: {
      termsExample: false,
      marketingExample: false,
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
        name='termsExample'
        validators={{
          onChange: ({ value }) => (!value ? 'You must accept the terms and conditions' : undefined),
        }}
        children={(field) => <field.CheckboxField label='I accept the terms and conditions' />}
      />

      <form.AppField
        name='marketingExample'
        children={(field) => (
          <field.CheckboxField
            label='Send me promotional emails'
            description='Optional: Receive updates about new features'
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton />
      </form.AppForm>
    </form>
  );
}
