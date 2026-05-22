'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  name: z.string().nonempty({ message: 'Name is required' }),
});

type Values = z.infer<typeof zodSchema>;

export default function InputFieldExample() {
  const form = useForm<Values>({
    defaultValues: { name: '' },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    try {
      alert(`Hello ${values.name}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <InputField lens={lens.focus('name')} label='Name' description='Your name' placeholder='John' />
        <SubmitButton>Check</SubmitButton>
      </form>
    </Form>
  );
}
