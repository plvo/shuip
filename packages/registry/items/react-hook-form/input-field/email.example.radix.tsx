'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  email: z.email({ message: 'Invalid email' }),
});

type Values = z.infer<typeof zodSchema>;

export default function InputFieldExample() {
  const form = useForm<Values>({
    defaultValues: { email: '' },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    try {
      alert(`Hello ${values.email}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <InputField
          lens={lens.focus('email')}
          type='email'
          label='Email'
          description='Your email'
          placeholder='john@example.com'
        />
        <SubmitButton>Check</SubmitButton>
      </form>
    </FormProvider>
  );
}
