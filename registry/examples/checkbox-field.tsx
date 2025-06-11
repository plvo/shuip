'use client';

import { Form } from '@/components/ui/form';
import CheckboxField from '@/components/ui/shuip/checkbox-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
      alert(`Checkbox: ${values.checkbox}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <CheckboxField control={form.control} name='checkbox' label='Checkbox' description='Your checkbox' />
        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
