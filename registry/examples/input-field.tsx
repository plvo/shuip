'use client';

import { Form } from '@/components/ui/form';
import { InputField } from '@/components/ui/shuip/input-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const zodSchema = z.object({
  name: z.string().nonempty({ message: 'Name is required' }),
});

export default function InputFieldExample() {
  const form = useForm({
    defaultValues: { name: '' },
    resolver: zodResolver(zodSchema),
  });

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(`Hello ${values.name}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <InputField register={form.register('name')} label='Name' description='Your name' placeholder='John' />
        <SubmitButton>Check</SubmitButton>
      </form>
    </Form>
  );
}
