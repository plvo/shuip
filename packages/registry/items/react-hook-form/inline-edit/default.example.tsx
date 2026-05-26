'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InlineEditField } from '@/components/ui/shuip/react-hook-form/inline-edit';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfInlineEditExample() {
  const form = useForm<Values>({
    defaultValues: { title: 'Project Apollo' },
    resolver: zodResolver(zodSchema),
    mode: 'onChange',
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    alert(JSON.stringify(values, null, 2));
  }

  async function saveTitle(next: string) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('saved', next);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-sm space-y-4'>
        <InlineEditField
          lens={lens.focus('title')}
          label='Title'
          description='Shown at the top of the project page.'
          size='title'
          onSave={saveTitle}
        />
        <SubmitButton>Save</SubmitButton>
      </form>
    </Form>
  );
}
