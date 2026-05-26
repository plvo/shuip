'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InlineEditField } from '@/components/ui/shuip/react-hook-form/inline-edit';

const zodSchema = z.object({
  bio: z.string().max(140, { message: 'Keep it under 140 characters' }),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfInlineEditNoLabelExample() {
  const form = useForm<Values>({
    defaultValues: { bio: 'Family-owned manufacturer since 1998.' },
    resolver: zodResolver(zodSchema),
    mode: 'onChange',
  });
  const lens = useLens({ control: form.control });

  async function saveBio(next: string) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('saved', next);
  }

  return (
    <Form {...form}>
      <div className='w-full max-w-sm'>
        <InlineEditField
          lens={lens.focus('bio')}
          input='textarea'
          variant='boxed'
          placeholder='Add a description'
          onSave={saveBio}
        />
      </div>
    </Form>
  );
}
