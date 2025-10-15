'use client';

import { useForm, useStore } from '@tanstack/react-form';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { SelectField } from '@/components/ui/shuip/tanstack-form/select-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfSelectFieldConditionalExample() {
  const form = useForm({
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
      <SelectField
        form={form}
        name='accountType'
        options={{
          Personal: 'personal',
          Business: 'business',
        }}
        label='Account Type'
        placeholder='Select account type'
        formProps={{
          validators: {
            onChange: ({ value }) => (!value ? 'Please select an account type' : undefined),
          },
        }}
      />

      {/* Show business fields only when Business is selected */}
      {accountType === 'business' && (
        <>
          <InputField
            form={form}
            name='businessName'
            label='Business Name'
            formProps={{
              validators: {
                onChange: ({ value }) => (!value ? 'Business name is required' : undefined),
              },
            }}
          />

          <SelectField
            form={form}
            name='companySize'
            options={{
              '1-10 employees': '1-10',
              '11-50 employees': '11-50',
              '51-200 employees': '51-200',
              '201-1000 employees': '201-1000',
              '1000+ employees': '1000+',
            }}
            label='Company Size'
            placeholder='Select company size'
            formProps={{
              validators: {
                onChange: ({ value }) => (!value ? 'Please select company size' : undefined),
              },
            }}
          />
        </>
      )}

      <SubmitButton form={form}>Create Account</SubmitButton>
    </form>
  );
}
