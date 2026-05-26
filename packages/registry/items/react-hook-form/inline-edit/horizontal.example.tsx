'use client';

import { useLens } from '@hookform/lenses';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { InlineEditField } from '@/components/ui/shuip/react-hook-form/inline-edit';

export default function RhfInlineEditHorizontalExample() {
  const form = useForm({
    defaultValues: { owner: 'Ada Lovelace', status: 'In progress' },
    mode: 'onChange',
  });
  const lens = useLens({ control: form.control });

  return (
    <Form {...form}>
      <div className='flex w-full max-w-md flex-col gap-3'>
        <InlineEditField lens={lens.focus('owner')} label='Owner' orientation='horizontal' />
        <InlineEditField lens={lens.focus('status')} label='Status' orientation='horizontal' />
      </div>
    </Form>
  );
}
