'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InlineEditField } from '@/components/ui/shuip/react-hook-form/inline-edit';

const zodSchema = z.object({
  owner: z.string().min(2, { message: 'Owner is required' }),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfInlineEditHorizontalExample() {
  const form = useForm<Values>({
    defaultValues: { owner: 'Ada Lovelace' },
    resolver: zodResolver(zodSchema),
    mode: 'onChange',
  });
  const lens = useLens({ control: form.control });

  async function saveOwner(next: string) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('saved', next);
  }

  return (
    <Form {...form}>
      <div className='w-full max-w-md'>
        <InlineEditField lens={lens.focus('owner')} label='Owner' orientation='horizontal' onSave={saveOwner} />
      </div>
    </Form>
  );
}
