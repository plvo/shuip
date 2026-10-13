'use client';

import { createFormHook } from '@tanstack/react-form';
import { CheckboxField } from '@/components/ui/shuip/tanstack-form/checkbox-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { CheckboxField },
  formComponents: { SubmitButton },
});

export default function TsfCheckboxFieldGroupExample() {
  const form = useAppForm({
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
          <form.AppField
            name='features.notifications'
            children={(field) => (
              <field.CheckboxField
                label='Enable push notifications'
                description='Receive real-time updates about your activity'
              />
            )}
          />

          <form.AppField
            name='features.analytics'
            children={(field) => (
              <field.CheckboxField
                label='Enable analytics tracking'
                description='Help us improve by sharing usage data'
              />
            )}
          />

          <form.AppField
            name='features.darkMode'
            children={(field) => (
              <field.CheckboxField label='Enable dark mode' description='Switch to a darker color scheme' />
            )}
          />

          <form.AppField
            name='features.apiAccess'
            children={(field) => (
              <field.CheckboxField label='Enable API access' description='Get programmatic access to your data' />
            )}
          />
        </div>
      </div>

      <form.AppForm>
        <form.SubmitButton>Save Preferences</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
