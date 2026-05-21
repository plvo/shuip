'use client';

import { useLens } from '@hookform/lenses';
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

type Values = z.infer<typeof zodSchema>;

export default function PasswordFieldLoginExample() {
  const form = useForm<Values>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
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
            <InputField lens={lens.focus('email')} label='Email' placeholder='john@example.com' />

            <PasswordField
              lens={lens.focus('password')}
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
