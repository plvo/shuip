'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { RadioField } from '@/components/ui/shuip/react-hook-form/radio-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  selection: z.enum(['Yes', 'No', 'Maybe', 'Not sure']),
});

export default function RadioFieldExample() {
  const form = useForm({
    defaultValues: {
      selection: 'Yes' as const,
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
        <RadioField
          register={form.register('selection')}
          options={['Yes', 'No', 'Maybe', 'Not sure']}
          label='Are you sure?'
          description='This is a description'
        />
        <SubmitButton>Check</SubmitButton>
      </form>
    </Form>
  );
}
