'use client';

import { useLens } from '@hookform/lenses';
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

type Values = z.infer<typeof zodSchema>;

export default function RhfRadioFieldPaymentMethodExample() {
  const form = useForm<Values>({
    defaultValues: {
      paymentMethod: undefined,
      cardNumber: '',
      paypalEmail: '',
      accountNumber: '',
    },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  const paymentMethod = form.watch('paymentMethod');

  async function onSubmit(values: Values) {
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
          lens={lens.focus('paymentMethod')}
          options={['card', 'paypal', 'bank']}
          label='Payment Method'
          description='Select how you want to pay'
        />

        {paymentMethod === 'card' && (
          <InputField
            lens={lens.focus('cardNumber')}
            label='Card Number'
            placeholder='1234 5678 9012 3456'
            description='Enter your credit card number'
          />
        )}

        {paymentMethod === 'paypal' && (
          <InputField
            lens={lens.focus('paypalEmail')}
            type='email'
            label='PayPal Email'
            placeholder='your@email.com'
            description='Email associated with your PayPal account'
          />
        )}

        {paymentMethod === 'bank' && (
          <InputField
            lens={lens.focus('accountNumber')}
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
