'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { PasswordField } from '@/components/ui/shuip/react-hook-form/password-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function RhfPasswordFieldConfirmPasswordExample() {
  const form = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(zodSchema),
  });

  async function onSubmit(_values: z.infer<typeof zodSchema>) {
    try {
      alert(`Password set successfully!`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <PasswordField
          register={form.register('password')}
          label='Password'
          description='Choose a strong password'
          placeholder='Enter password'
        />

        <PasswordField
          register={form.register('confirmPassword')}
          label='Confirm Password'
          description='Re-enter your password to confirm'
          placeholder='Confirm password'
        />

        <SubmitButton>Set Password</SubmitButton>
      </form>
    </Form>
  );
}
