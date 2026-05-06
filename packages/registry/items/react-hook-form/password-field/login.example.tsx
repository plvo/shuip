'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { PasswordField } from '@/components/ui/shuip/react-hook-form/password-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  email: z.email({ message: 'Invalid email' }),
  password: z.string().nonempty({ message: 'Password is required' }),
});

export default function InputFieldExample() {
  const form = useForm({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(zodSchema),
  });

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(`Hello ${values.email} ${values.password}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <InputField register={form.register('email')} label='Email' placeholder='john@example.com' />

            <PasswordField
              register={form.register('password')}
              label='Password'
              placeholder='Password'
              tooltip='Must contain: 8+ characters, uppercase, number, special char'
            />
          </CardContent>
          <CardFooter>
            <SubmitButton>Login</SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
