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
  const form = useAppForm({ defaultValues: { owner: 'Ada Lovelace' } });

  async function saveOwner(next: string) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('saved', next);
  }

  return (
    <div className='w-full max-w-md'>
      <form.AppField
        name='owner'
        validators={{ onChange: ({ value }) => (value.length < 2 ? 'Owner is required' : undefined) }}
        children={(field) => <field.InlineEditField label='Owner' orientation='horizontal' onSave={saveOwner} />}
      />
    </div>
  );
}
