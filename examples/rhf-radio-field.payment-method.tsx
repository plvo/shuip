'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { RadioField } from '@/components/ui/shuip/react-hook-form/radio-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  paymentMethod: z.enum(['card', 'paypal', 'bank'], {
    error: 'Please select a payment method',
  }),
  cardNumber: z.string().optional(),
  paypalEmail: z.string().optional(),
  accountNumber: z.string().optional(),
});

export default function RhfRadioFieldPaymentMethodExample() {
  const form = useForm({
    defaultValues: {
      paymentMethod: undefined,
      cardNumber: '',
      paypalEmail: '',
      accountNumber: '',
    },
    resolver: zodResolver(zodSchema),
  });

  const paymentMethod = form.watch('paymentMethod');

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(JSON.stringify(values, null, 2));
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <RadioField
          register={form.register('paymentMethod')}
          options={['card', 'paypal', 'bank']}
          label='Payment Method'
          description='Select how you want to pay'
        />

        {paymentMethod === 'card' && (
          <InputField
            register={form.register('cardNumber')}
            label='Card Number'
            placeholder='1234 5678 9012 3456'
            description='Enter your credit card number'
          />
        )}

        {paymentMethod === 'paypal' && (
          <InputField
            register={form.register('paypalEmail')}
            type='email'
            label='PayPal Email'
            placeholder='your@email.com'
            description='Email associated with your PayPal account'
          />
        )}

        {paymentMethod === 'bank' && (
          <InputField
            register={form.register('accountNumber')}
            label='Account Number'
            placeholder='Enter your account number'
            description='Your bank account number for direct transfer'
          />
        )}

        <SubmitButton>Process Payment</SubmitButton>
      </form>
    </Form>
  );
}
