'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InlineEditField } from '@/components/ui/shuip/react-hook-form/inline-edit';

const schema = z.object({
  bio: z.string().max(140, { message: 'Keep it under 140 characters' }),
});

type Values = z.infer<typeof schema>;

export default function RhfInlineEditNoLabelExample() {
  const form = useForm<Values>({ defaultValues: { bio: '' }, resolver: zodResolver(schema), mode: 'onChange' });
  const lens = useLens({ control: form.control });

  return (
    <Form {...form}>
      <div className='w-full max-w-sm'>
        <InlineEditField lens={lens.focus('bio')} input='textarea' variant='boxed' placeholder='Add a description…' />
      </div>
    </Form>
  );
}
