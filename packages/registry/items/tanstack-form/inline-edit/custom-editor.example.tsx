'use client';

import { createFormHook } from '@tanstack/react-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { InlineEditField } from '@/components/ui/shuip/tanstack-form/inline-edit';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InlineEditField },
  formComponents: {},
});

const statuses = ['Backlog', 'In progress', 'Done'];

export default function TsfInlineEditCustomEditorExample() {
  const form = useAppForm({ defaultValues: { status: 'In progress' } });

  return (
    <div className='w-full max-w-sm'>
      <form.AppField
        name='status'
        children={(field) => (
          <field.InlineEditField label='Status'>
            {({ value, commit, cancel }) => (
              <Select
                defaultOpen
                value={value}
                onValueChange={commit}
                onOpenChange={(open) => {
                  if (!open) cancel();
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </field.InlineEditField>
        )}
      />
    </div>
  );
}
