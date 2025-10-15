'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { RadioField } from '@/components/ui/shuip/react-hook-form/radio-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const PLANS = ['free', 'pro', 'enterprise'];
const PLAN_PRICES = { free: 0, pro: 29, enterprise: 99 };

const zodSchema = z.object({
  plan: z.enum(PLANS, {
    error: 'Please select a plan',
  }),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
});

export default function RhfRadioFieldConditionalPricingExample() {
  const form = useForm({
    defaultValues: {
      plan: '',
      billingCycle: 'monthly',
    },
    resolver: zodResolver(zodSchema),
  });

  const plan = form.watch('plan') as keyof typeof PLAN_PRICES;
  const billingCycle = form.watch('billingCycle');

  const monthlyPrice = PLAN_PRICES[plan] || 0;
  const annualPrice = monthlyPrice * 12 * 0.8; // 20% discount
  const displayPrice = billingCycle === 'annual' ? annualPrice / 12 : monthlyPrice;

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
          register={form.register('plan')}
          options={PLANS}
          label='Select Plan'
          description='Choose the plan that fits your needs'
        />

        {plan && plan !== 'free' && (
          <RadioField
            register={form.register('billingCycle')}
            options={['monthly', 'annual']}
            label='Billing Cycle'
            description='Annual billing includes a 20% discount'
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

        <SubmitButton>Continue</SubmitButton>
      </form>
    </Form>
  );
}
