'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  email: z.string().email('Invalid email format'),
  age: z.coerce.number().min(18, 'Must be at least 18 years old').max(120, 'Age must be realistic'),
});

export default function RhfInputFieldValidationExample() {
  const form = useForm({
    defaultValues: { username: '', email: '', age: '' },
    resolver: zodResolver(zodSchema),
  });

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(`User: ${values.username}\nEmail: ${values.email}\nAge: ${values.age}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <InputField
          register={form.register('username')}
          label='Username'
          description='Username will be used for your profile'
          placeholder='Enter username'
        />

        <InputField
          register={form.register('email')}
          type='email'
          label='Email'
          description='We will send confirmation to this email'
          placeholder='your@email.com'
        />

        <InputField
          register={form.register('age')}
          type='number'
          label='Age'
          description='You must be 18 or older to register'
          placeholder='25'
        />

        <SubmitButton>Register</SubmitButton>
      </form>
    </Form>
  );
}
