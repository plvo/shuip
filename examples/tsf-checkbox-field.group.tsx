'use client';

import { useForm } from '@tanstack/react-form';
import { CheckboxField } from '#/registry/ui/tsf-checkbox-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfCheckboxFieldGroupExample() {
  const form = useForm({
    defaultValues: {
      features: {
        notifications: false,
        analytics: false,
        darkMode: false,
        apiAccess: false,
      },
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <div className='space-y-3'>
        <h3 className='font-semibold'>Features</h3>
        <p className='text-sm text-muted-foreground'>Select the features you want to enable</p>

        <div className='space-y-3'>
          <CheckboxField
            form={form}
            name='features.notifications'
            label='Enable push notifications'
            description='Receive real-time updates about your activity'
          />

          <CheckboxField
            form={form}
            name='features.analytics'
            label='Enable analytics tracking'
            description='Help us improve by sharing usage data'
          />

          <CheckboxField
            form={form}
            name='features.darkMode'
            label='Enable dark mode'
            description='Switch to a darker color scheme'
          />

          <CheckboxField
            form={form}
            name='features.apiAccess'
            label='Enable API access'
            description='Get programmatic access to your data'
          />
        </div>
      </div>

      <SubmitButton form={form}>Save Preferences</SubmitButton>
    </form>
  );
}
