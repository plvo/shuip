'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { PasswordField } from '@/components/ui/shuip/react-hook-form/password-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  password: z
    .string()
    .nonempty({ message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[!@#$%^&*]/, { message: 'Password must contain at least one special character' }),
});

type Values = z.infer<typeof zodSchema>;

export default function PasswordFieldTooltipExample() {
  const form = useForm<Values>({
    defaultValues: { password: '' },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    try {
      alert(`Hello ${values.password}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <PasswordField
          lens={lens.focus('password')}
          label='Password'
          description='Your password'
          placeholder='Password'
          tooltip='Must contain: 8+ characters, uppercase, number, special char'
        />
        <SubmitButton>Check</SubmitButton>
      </form>
    </Form>
  );
}
