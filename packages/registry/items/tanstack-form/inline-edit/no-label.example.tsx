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

export default function TsfInlineEditNoLabelExample() {
  const form = useAppForm({ defaultValues: { bio: '' } });

  return (
    <div className='w-full max-w-sm'>
      <form.AppField
        name='bio'
        validators={{ onChange: ({ value }) => (value.length > 140 ? 'Keep it under 140 characters' : undefined) }}
        children={(field) => (
          <field.InlineEditField input='textarea' variant='boxed' placeholder='Add a description…' />
        )}
      />
    </div>
  );
}
