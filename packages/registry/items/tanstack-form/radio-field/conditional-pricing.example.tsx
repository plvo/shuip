'use client';

import { createFormHook, useStore } from '@tanstack/react-form';
import { Card } from '@/components/ui/card';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { RadioField } from '@/components/ui/shuip/tanstack-form/radio-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const PLANS = [
  { label: 'Free - $0/month', value: 'free', price: 0 },
  { label: 'Pro - $29/month', value: 'pro', price: 29 },
  { label: 'Enterprise - $99/month', value: 'enterprise', price: 99 },
];

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { RadioField },
  formComponents: { SubmitButton },
});

export default function TsfRadioFieldConditionalPricingExample() {
  const form = useAppForm({
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
      <form.AppField
        name='plan'
        validators={{
          onChange: ({ value }) => (!value ? 'Please select a plan' : undefined),
        }}
        children={(field) => (
          <field.RadioField options={PLANS.map((p) => ({ label: p.label, value: p.value }))} label='Select Plan' />
        )}
      />

      {plan && plan !== 'free' && (
        <form.AppField
          name='billingCycle'
          children={(field) => (
            <field.RadioField
              options={[
                { label: 'Monthly', value: 'monthly' },
                { label: 'Annual (Save 20%)', value: 'annual' },
              ]}
              label='Billing Cycle'
            />
          )}
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

      <form.AppForm>
        <form.SubmitButton>Continue</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
