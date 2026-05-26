'use client';

import { useLens } from '@hookform/lenses';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { InlineEditField } from '@/components/ui/shuip/react-hook-form/inline-edit';

export default function RhfInlineEditSizesExample() {
  const form = useForm({
    defaultValues: { heading: 'Untitled document', subtitle: 'A short subtitle', tag: 'draft' },
    mode: 'onChange',
  });
  const lens = useLens({ control: form.control });

  return (
    <Form {...form}>
      <div className='flex w-full max-w-sm flex-col gap-2'>
        <InlineEditField lens={lens.focus('heading')} size='title' />
        <InlineEditField lens={lens.focus('subtitle')} />
        <InlineEditField lens={lens.focus('tag')} size='sm' />
      </div>
    </Form>
  );
}
