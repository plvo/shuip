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

export default function TsfInlineEditSizesExample() {
  const form = useAppForm({
    defaultValues: { heading: 'Untitled document', subtitle: 'A short subtitle', tag: 'draft' },
  });

  return (
    <div className='flex w-full max-w-sm flex-col gap-2'>
      <form.AppField name='heading' children={(field) => <field.InlineEditField size='title' />} />
      <form.AppField name='subtitle' children={(field) => <field.InlineEditField />} />
      <form.AppField name='tag' children={(field) => <field.InlineEditField size='sm' />} />
    </div>
  );
}
