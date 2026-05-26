'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { InlineEditField } from '@/components/ui/shuip/tanstack-form/inline-edit';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InlineEditField },
  formComponents: {},
});

export default function TsfInlineEditHorizontalExample() {
  const form = useAppForm({ defaultValues: { owner: 'Ada Lovelace', status: 'In progress' } });

  return (
    <div className='flex w-full max-w-md flex-col gap-3'>
      <form.AppField
        name='owner'
        children={(field) => <field.InlineEditField label='Owner' orientation='horizontal' />}
      />
      <form.AppField
        name='status'
        children={(field) => <field.InlineEditField label='Status' orientation='horizontal' />}
      />
    </div>
  );
}
