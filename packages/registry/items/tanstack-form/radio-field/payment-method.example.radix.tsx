'use client';

import { createFormHook, useStore } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { RadioField } from '@/components/ui/shuip/tanstack-form/radio-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField, RadioField },
  formComponents: { SubmitButton },
});

export default function TsfRadioFieldPaymentMethodExample() {
  const form = useAppForm({
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
      <form.AppField
        name='paymentMethod'
        validators={{
          onChange: ({ value }) => (!value ? 'Please select a payment method' : undefined),
        }}
        children={(field) => (
          <field.RadioField
            options={[
              { label: 'Credit Card', value: 'card' },
              { label: 'PayPal', value: 'paypal' },
              { label: 'Bank Transfer', value: 'bank' },
            ]}
            label='Payment Method'
            description='Select how you want to pay'
          />
        )}
      />

      {paymentMethod === 'card' && (
        <form.AppField
          name='cardNumber'
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Card number is required';
              if (!/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(value)) return 'Invalid card number format';
              return undefined;
            },
          }}
          children={(field) => <field.InputField label='Card Number' props={{ placeholder: '1234 5678 9012 3456' }} />}
        />
      )}

      {paymentMethod === 'paypal' && (
        <form.AppField
          name='paypalEmail'
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Email is required';
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
              return undefined;
            },
          }}
          children={(field) => (
            <field.InputField label='PayPal Email' props={{ type: 'email', placeholder: 'your@email.com' }} />
          )}
        />
      )}

      {paymentMethod === 'bank' && (
        <form.AppField
          name='accountNumber'
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Account number is required';
              if (value.length < 8) return 'Account number must be at least 8 digits';
              return undefined;
            },
          }}
          children={(field) => (
            <field.InputField label='Account Number' props={{ placeholder: 'Enter your account number' }} />
          )}
        />
      )}

      <form.AppForm>
        <form.SubmitButton>Process Payment</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
