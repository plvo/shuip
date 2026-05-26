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

export default function TsfInlineEditVariantsExample() {
  const form = useAppForm({ defaultValues: { ghost: 'Seamless, no border', boxed: 'Bordered input on edit' } });

  return (
    <div className='flex w-full max-w-sm flex-col gap-4'>
      <form.AppField name='ghost' children={(field) => <field.InlineEditField label='Ghost' variant='ghost' />} />
      <form.AppField name='boxed' children={(field) => <field.InlineEditField label='Boxed' variant='boxed' />} />
    </div>
  );
}
