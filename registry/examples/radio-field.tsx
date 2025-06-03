'use client';

import { Form } from '@/components/ui/form';
import { RadioField } from '@/components/ui/shuip/radio-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const zodSchema = z.object({
  selection: z.enum(['1', '2', '3']),
});

export default function RadioFieldExample() {
  const form = useForm({
    defaultValues: {
      selection: '1' as const,
    },
    resolver: zodResolver(zodSchema),
  });

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(`Selection: ${values.selection}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <RadioField control={form.control} name='selection' label='selection' values={['1', '2', '3']} />
        <SubmitButton>Check</SubmitButton>
      </form>
    </Form>
  );
}
