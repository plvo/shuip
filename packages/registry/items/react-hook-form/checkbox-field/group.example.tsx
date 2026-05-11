'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { CheckboxField } from '@/components/ui/shuip/react-hook-form/checkbox-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  features: z.object({
    notifications: z.boolean(),
    analytics: z.boolean(),
    darkMode: z.boolean(),
    apiAccess: z.boolean(),
  }),
});

export default function CheckboxFieldGroupExample() {
  const form = useForm({
    defaultValues: { features: { notifications: false, analytics: false, darkMode: false, apiAccess: false } },
    resolver: zodResolver(zodSchema),
  });

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(`Features: ${JSON.stringify(values.features, null, 2)}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <div className='space-y-3'>
          <h3 className='font-semibold'>Features</h3>
          <p className='text-sm text-muted-foreground'>Select the features you want to enable</p>

          <div className='space-y-3'>
            <CheckboxField
              register={form.register('features.notifications')}
              label='Enable push notifications'
              description='Receive real-time updates about your activity'
            />

            <CheckboxField
              register={form.register('features.analytics')}
              label='Enable analytics tracking'
              description='Help us improve by sharing usage data'
            />

            <CheckboxField
              register={form.register('features.darkMode')}
              label='Enable dark mode'
              description='Switch to a darker color scheme'
            />

            <CheckboxField
              register={form.register('features.apiAccess')}
              label='Enable API access'
              description='Get programmatic access to your data'
            />
          </div>
        </div>

        <SubmitButton>Save Preferences</SubmitButton>
      </form>
    </Form>
  );
}
