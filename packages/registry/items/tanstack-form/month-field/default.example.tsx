'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { MonthField } from '@/components/ui/shuip/tanstack-form/month-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { MonthField },
  formComponents: { SubmitButton },
});

export default function TsfMonthFieldExample() {
  const form = useAppForm({
    defaultValues: {
      billingMonth: undefined as Date | undefined,
    },
    onSubmit: async ({ value }) => {
      if (!value.billingMonth) return;
      alert(
        `Billing month: ${value.billingMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}\nISO: ${value.billingMonth.toISOString()}`,
      );
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
        name='billingMonth'
        validators={{
          onChange: ({ value }) => (value ? undefined : 'Pick a billing month'),
        }}
        children={(field) => (
          <field.MonthField label='Billing month' description='The first day of the selected month is stored.' />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Submit</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
