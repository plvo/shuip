'use client';

import { createFormHook } from '@tanstack/react-form';
import { AutocompleteField } from '@/components/ui/shuip/tanstack-form/autocomplete-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const SOURCES = ['LinkedIn', 'IRL', 'Prospection', 'Referral', 'Website', 'Cold call'];

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { AutocompleteField },
  formComponents: { SubmitButton },
});

export default function TsfAutocompleteFieldExample() {
  const form = useAppForm({
    defaultValues: {
      source: '',
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
        name='source'
        validators={{
          onChange: ({ value }) => (value.length === 0 ? 'Source is required' : undefined),
        }}
        children={(field) => (
          <field.AutocompleteField
            label='Source'
            description='Pick a known source or type your own'
            placeholder='e.g. LinkedIn'
            suggestions={SOURCES}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Submit</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
