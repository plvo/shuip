'use client';

import { createFormHook } from '@tanstack/react-form';
import type { DateRange } from 'react-day-picker';
import { DateRangeField } from '@/components/ui/shuip/tanstack-form/date-range-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { DateRangeField },
  formComponents: { SubmitButton },
});

interface Values {
  stay: DateRange | undefined;
}

export default function TsfDateRangeFieldExample() {
  const form = useAppForm({
    defaultValues: { stay: undefined } as Values,
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
        name='stay'
        children={(field) => <field.DateRangeField label='Stay' description='Pick check-in and check-out dates' />}
      />

      <form.AppForm>
        <form.SubmitButton>Save</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
