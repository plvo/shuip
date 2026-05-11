'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { PhoneField } from '@/components/ui/shuip/react-hook-form/phone-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g. +33612345678)'),
});

export default function PhoneFieldExample() {
  const form = useForm({
    defaultValues: { phone: '' },
    resolver: zodResolver(zodSchema),
  });

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(`Phone: ${values.phone}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <PhoneField
          register={form.register('phone')}
          label='Phone'
          description='Use international E.164 format'
          placeholder='+33612345678'
        />
        <SubmitButton>Check</SubmitButton>
      </form>
    </Form>
  );
}
