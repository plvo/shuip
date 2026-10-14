'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { RadioField } from '@/components/ui/shuip/react-hook-form/radio-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  paymentMethod: z.enum(['card', 'paypal', 'bank'], {
    error: 'Please select a payment method',
  }),
  cardNumber: z.string(),
  paypalEmail: z.string(),
  accountNumber: z.string(),
});

type FormValues = { paymentMethod: string; cardNumber: string; paypalEmail: string; accountNumber: string };
type SubmitValues = z.infer<typeof zodSchema>;

export default function RhfRadioFieldPaymentMethodExample() {
  const form = useForm<FormValues, unknown, SubmitValues>({
    defaultValues: {
      paymentMethod: '',
      cardNumber: '',
      paypalEmail: '',
      accountNumber: '',
    },
    resolver: zodResolver<FormValues, unknown, SubmitValues>(zodSchema),
  });
  const lens = useLens({ control: form.control });

  const paymentMethod = form.watch('paymentMethod');

  async function onSubmit(values: SubmitValues) {
    try {
      alert(JSON.stringify(values, null, 2));
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <FormProvider {...form}>
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
    </FormProvider>
  );
}
