'use client';

import { createFormHook } from '@tanstack/react-form';
import { DateField } from '@/components/ui/shuip/tanstack-form/date-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { DateField },
  formComponents: { SubmitButton },
});

export default function TsfDateFieldExample() {
  const form = useAppForm({
    defaultValues: {
      dueDate: undefined as Date | undefined,
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(JSON.stringify({ dueDate: value.dueDate?.toISOString() ?? null }, null, 2));
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
        name='dueDate'
        validators={{
          onChange: ({ value }) => (value ? undefined : 'Pick a due date'),
        }}
        children={(field) => <field.DateField label='Due date' description='When should this task be done?' />}
      />

      <form.AppForm>
        <form.SubmitButton>Save</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
