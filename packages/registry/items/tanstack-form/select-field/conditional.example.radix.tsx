'use client';

import { createFormHook, useStore } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { SelectField } from '@/components/ui/shuip/tanstack-form/select-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField, SelectField },
  formComponents: { SubmitButton },
});

export default function TsfSelectFieldConditionalExample() {
  const form = useAppForm({
    defaultValues: {
      accountType: '',
      businessName: '',
      companySize: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  const accountType = useStore(form.store, (state) => state.values.accountType);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <form.AppField
        name='accountType'
        validators={{
          onChange: ({ value }) => (!value ? 'Please select an account type' : undefined),
        }}
        children={(field) => (
          <field.SelectField
            options={{
              Personal: 'personal',
              Business: 'business',
            }}
            label='Account Type'
            placeholder='Select account type'
          />
        )}
      />

      {/* Show business fields only when Business is selected */}
      {accountType === 'business' && (
        <>
          <form.AppField
            name='businessName'
            validators={{
              onChange: ({ value }) => (!value ? 'Business name is required' : undefined),
            }}
            children={(field) => <field.InputField label='Business Name' />}
          />

          <form.AppField
            name='companySize'
            validators={{
              onChange: ({ value }) => (!value ? 'Please select company size' : undefined),
            }}
            children={(field) => (
              <field.SelectField
                options={{
                  '1-10 employees': '1-10',
                  '11-50 employees': '11-50',
                  '51-200 employees': '51-200',
                  '201-1000 employees': '201-1000',
                  '1000+ employees': '1000+',
                }}
                label='Company Size'
                placeholder='Select company size'
              />
            )}
          />
        </>
      )}

      <form.AppForm>
        <form.SubmitButton>Create Account</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
