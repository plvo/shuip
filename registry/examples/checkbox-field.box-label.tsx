'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import CheckboxField from '@/components/ui/shuip/checkbox-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  checkbox: z.boolean(),
});

export default function CheckboxFieldExample() {
  const form = useForm({
    defaultValues: { checkbox: false },
    resolver: zodResolver(zodSchema),
  });

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(`Checkbox: ${values}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <CheckboxField
          register={form.register('checkbox')}
          label='Checkbox'
          description='Your checkbox'
          boxLabel='Box description'
        />
        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
