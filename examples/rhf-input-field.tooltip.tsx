'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

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
        <InputField
          register={form.register('name')}
          label='Name'
          description='Your name'
          placeholder='John'
          tooltip='This is a tooltip where you can put some text'
        />
        <SubmitButton>Check</SubmitButton>
      </form>
    </Form>
  );
}
