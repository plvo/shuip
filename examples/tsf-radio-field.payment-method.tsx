'use client';

import { useForm, useStore } from '@tanstack/react-form';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { RadioField } from '@/components/ui/shuip/tanstack-form/radio-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfRadioFieldPaymentMethodExample() {
  const form = useForm({
    defaultValues: {
      paymentMethod: '',
      cardNumber: '',
      paypalEmail: '',
      accountNumber: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  const paymentMethod = useStore(form.store, (state) => state.values.paymentMethod);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <RadioField
        form={form}
        name='paymentMethod'
        options={[
          { label: 'Credit Card', value: 'card' },
          { label: 'PayPal', value: 'paypal' },
          { label: 'Bank Transfer', value: 'bank' },
        ]}
        label='Payment Method'
        description='Select how you want to pay'
        formProps={{
          validators: {
            onChange: ({ value }) => (!value ? 'Please select a payment method' : undefined),
          },
        }}
      />

      {paymentMethod === 'card' && (
        <InputField
          form={form}
          name='cardNumber'
          label='Card Number'
          props={{ placeholder: '1234 5678 9012 3456' }}
          formProps={{
            validators: {
              onChange: ({ value }) => {
                if (!value) return 'Card number is required';
                if (!/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(value)) return 'Invalid card number format';
                return undefined;
              },
            },
          }}
        />
      )}

      {paymentMethod === 'paypal' && (
        <InputField
          form={form}
          name='paypalEmail'
          label='PayPal Email'
          props={{ type: 'email', placeholder: 'your@email.com' }}
          formProps={{
            validators: {
              onChange: ({ value }) => {
                if (!value) return 'Email is required';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
                return undefined;
              },
            },
          }}
        />
      )}

      {paymentMethod === 'bank' && (
        <InputField
          form={form}
          name='accountNumber'
          label='Account Number'
          props={{ placeholder: 'Enter your account number' }}
          formProps={{
            validators: {
              onChange: ({ value }) => {
                if (!value) return 'Account number is required';
                if (value.length < 8) return 'Account number must be at least 8 digits';
                return undefined;
              },
            },
          }}
        />
      )}

      <SubmitButton form={form}>Process Payment</SubmitButton>
    </form>
  );
}
