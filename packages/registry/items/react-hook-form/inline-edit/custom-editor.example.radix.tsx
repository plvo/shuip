'use client';

import { useLens } from '@hookform/lenses';
import { FormProvider, useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineEditField } from '@/components/ui/shuip/react-hook-form/inline-edit';

const statuses = ['Backlog', 'In progress', 'Done'];

export default function RhfInlineEditCustomEditorExample() {
  const form = useForm({ defaultValues: { status: 'In progress' }, mode: 'onChange' });
  const lens = useLens({ control: form.control });

  return (
    <FormProvider {...form}>
      <div className='w-full max-w-sm'>
        <InlineEditField lens={lens.focus('status')} label='Status'>
          {({ value, commit, cancel }) => (
            <Select
              defaultOpen
              value={value}
              onValueChange={(next: string | null) => next !== null && commit(next)}
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
        </InlineEditField>
      </div>
    </FormProvider>
  );
}
