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

const startOfCurrentMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export default function TsfMonthFieldValidationExample() {
  const form = useAppForm({
    defaultValues: {
      startMonth: undefined as Date | undefined,
    },
    onSubmit: async ({ value }) => {
      if (!value.startMonth) return;
      alert(`Start month: ${value.startMonth.toISOString()}`);
    },
  });

  const minDate = startOfCurrentMonth();
  const tenYearsFromNow = new Date();
  tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <form.AppField
        name='startMonth'
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'Start month is required';
            if (value.getTime() < startOfCurrentMonth().getTime()) {
              return 'Must be the current month or later';
            }
            return undefined;
          },
        }}
        children={(field) => (
          <field.MonthField
            label='Subscription start'
            description='Past months are disabled in the calendar and rejected by the validator.'
            minDate={minDate}
            maxDate={tenYearsFromNow}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Start subscription</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
