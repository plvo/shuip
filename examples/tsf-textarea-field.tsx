'use client';

import { useForm } from '@tanstack/react-form';
import { TextareaField } from '@/components/ui/shuip/tanstack-form/textarea-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfTextareaFieldExample() {
  const form = useForm({
    defaultValues: {
      bio: '',
      feedback: '',
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
      <TextareaField
        form={form}
        name='bio'
        label='Biography'
        description='Tell us about yourself'
        props={{ rows: 4, placeholder: 'Software engineer passionate about...' }}
        formProps={{
          validators: {
            onChange: ({ value }) => {
              if (!value) return 'Bio is required';
              if (value.length < 20) return 'Bio must be at least 20 characters';
              return undefined;
            },
          },
        }}
      />

      <TextareaField
        form={form}
        name='feedback'
        label='Feedback'
        description='Share your thoughts or suggestions'
        props={{ rows: 6, placeholder: 'Your feedback helps us improve...' }}
      />

      <SubmitButton form={form}>Submit</SubmitButton>
    </form>
  );
}
