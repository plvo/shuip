'use client';

import { useLens } from '@hookform/lenses';
import { FormProvider, useForm } from 'react-hook-form';
import { InlineEditField } from '@/components/ui/shuip/react-hook-form/inline-edit';

export default function RhfInlineEditVariantsExample() {
  const form = useForm({
    defaultValues: { ghost: 'Seamless, no border', boxed: 'Bordered input on edit' },
    mode: 'onChange',
  });
  const lens = useLens({ control: form.control });

  return (
    <FormProvider {...form}>
      <div className='flex w-full max-w-sm flex-col gap-4'>
        <InlineEditField lens={lens.focus('ghost')} label='Ghost' variant='ghost' />
        <InlineEditField lens={lens.focus('boxed')} label='Boxed' variant='boxed' />
      </div>
    </FormProvider>
  );
}
