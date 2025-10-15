'use client';

import { useForm } from '@tanstack/react-form';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfInputFieldTooltipExample() {
  const form = useForm({
    defaultValues: {
      apiKey: '',
      webhookUrl: '',
      secretKey: '',
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
      <InputField
        form={form}
        name='apiKey'
        label='API Key'
        description='Your application API key'
        tooltip={
          <>
            <p className='font-semibold mb-1'>Where to find your API key:</p>
            <ol className='list-decimal list-inside space-y-1 text-sm'>
              <li>Go to Settings → API</li>
              <li>Click "Generate New Key"</li>
              <li>Copy the key (it will only be shown once)</li>
            </ol>
          </>
        }
        props={{ placeholder: 'sk_live_...' }}
        formProps={{
          validators: {
            onChange: ({ value }) => {
              if (!value) return 'API key is required';
              if (!value.startsWith('sk_')) return 'API key must start with sk_';
              if (value.length < 20) return 'API key is too short';
              return undefined;
            },
          },
        }}
      />

      <InputField
        form={form}
        name='webhookUrl'
        label='Webhook URL'
        description='Endpoint to receive webhook events'
        tooltip='This URL must be publicly accessible and accept POST requests. We recommend using HTTPS for security.'
        props={{ type: 'url', placeholder: 'https://api.example.com/webhooks' }}
        formProps={{
          validators: {
            onChange: ({ value }) => {
              if (!value) return 'Webhook URL is required';
              if (!value.startsWith('https://')) return 'Webhook URL must use HTTPS';
              try {
                new URL(value);
                return undefined;
              } catch {
                return 'Invalid URL format';
              }
            },
          },
        }}
      />

      <InputField
        form={form}
        name='secretKey'
        label='Webhook Secret'
        description='Used to verify webhook signatures'
        tooltip='Keep this secret safe. It will be used to sign webhook payloads so you can verify their authenticity.'
        props={{ placeholder: 'whsec_...' }}
        formProps={{
          validators: {
            onChange: ({ value }) => {
              if (!value) return 'Webhook secret is required';
              if (value.length < 16) return 'Secret must be at least 16 characters';
              return undefined;
            },
          },
        }}
      />

      <SubmitButton form={form}>Save Configuration</SubmitButton>
    </form>
  );
}
