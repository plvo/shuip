'use client';

import { useForm, useStore } from '@tanstack/react-form';
import { Card } from '@/components/ui/card';
import { RadioField } from '@/components/ui/shuip/tanstack-form/radio-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const PLANS = [
  { label: 'Free - $0/month', value: 'free', price: 0 },
  { label: 'Pro - $29/month', value: 'pro', price: 29 },
  { label: 'Enterprise - $99/month', value: 'enterprise', price: 99 },
];

export default function TsfRadioFieldConditionalPricingExample() {
  const form = useForm({
    defaultValues: {
      plan: '',
      billingCycle: 'monthly',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  const plan = useStore(form.store, (state) => state.values.plan);
  const billingCycle = useStore(form.store, (state) => state.values.billingCycle);

  const selectedPlan = PLANS.find((p) => p.value === plan);
  const monthlyPrice = selectedPlan?.price || 0;
  const annualPrice = monthlyPrice * 12 * 0.8; // 20% discount
  const displayPrice = billingCycle === 'annual' ? annualPrice / 12 : monthlyPrice;

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
        name='plan'
        options={PLANS.map((p) => ({ label: p.label, value: p.value }))}
        label='Select Plan'
        formProps={{
          validators: {
            onChange: ({ value }) => (!value ? 'Please select a plan' : undefined),
          },
        }}
      />

      {plan && plan !== 'free' && (
        <RadioField
          form={form}
          name='billingCycle'
          options={[
            { label: 'Monthly', value: 'monthly' },
            { label: 'Annual (Save 20%)', value: 'annual' },
          ]}
          label='Billing Cycle'
        />
      )}

      {plan && (
        <Card className='p-4'>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span className='font-semibold'>Plan:</span>
              <span className='capitalize'>{plan}</span>
            </div>
            {plan !== 'free' && (
              <>
                <div className='flex justify-between'>
                  <span className='font-semibold'>Billing:</span>
                  <span className='capitalize'>{billingCycle}</span>
                </div>
                <div className='flex justify-between text-lg font-bold'>
                  <span>Total:</span>
                  <span>${displayPrice.toFixed(2)}/month</span>
                </div>
                {billingCycle === 'annual' && (
                  <p className='text-sm text-muted-foreground'>Billed annually at ${annualPrice.toFixed(2)}</p>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      <SubmitButton form={form}>Continue</SubmitButton>
    </form>
  );
}
