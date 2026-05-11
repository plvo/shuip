'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { PhoneField } from '@/components/ui/shuip/react-hook-form/phone-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const E164 = /^\+[1-9]\d{1,14}$/;

const zodSchema = z.object({
  primary: z.string().regex(E164, 'Primary phone must be in E.164 format'),
  secondary: z.string().regex(E164, 'Secondary phone must be in E.164 format').optional().or(z.literal('')),
});

export default function PhoneFieldValidationExample() {
  const form = useForm({
    defaultValues: { primary: '', secondary: '' },
    resolver: zodResolver(zodSchema),
  });

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(`Primary: ${values.primary}\nSecondary: ${values.secondary || '(none)'}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <PhoneField
          register={form.register('primary')}
          label='Primary phone'
          description='Required. Include the country code prefix.'
          placeholder='+12025550123'
        />
        <PhoneField
          register={form.register('secondary')}
          label='Secondary phone'
          description='Optional alternate number.'
          placeholder='+442071838750'
        />
        <SubmitButton>Save</SubmitButton>
      </form>
    </Form>
  );
}
