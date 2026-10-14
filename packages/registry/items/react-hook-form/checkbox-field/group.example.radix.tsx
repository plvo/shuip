'use client';

import { useLens } from '@hookform/lenses';
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

type Values = z.infer<typeof zodSchema>;

export default function CheckboxFieldGroupExample() {
  const form = useForm<Values>({
    defaultValues: { features: { notifications: false, analytics: false, darkMode: false, apiAccess: false } },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });
  const featuresLens = lens.focus('features');

  async function onSubmit(values: Values) {
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
              lens={featuresLens.focus('notifications')}
              label='Enable push notifications'
              description='Receive real-time updates about your activity'
            />

            <CheckboxField
              lens={featuresLens.focus('analytics')}
              label='Enable analytics tracking'
              description='Help us improve by sharing usage data'
            />

            <CheckboxField
              lens={featuresLens.focus('darkMode')}
              label='Enable dark mode'
              description='Switch to a darker color scheme'
            />

            <CheckboxField
              lens={featuresLens.focus('apiAccess')}
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
