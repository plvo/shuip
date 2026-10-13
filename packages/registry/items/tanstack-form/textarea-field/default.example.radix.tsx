'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';
import { TextareaField } from '@/components/ui/shuip/tanstack-form/textarea-field';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextareaField },
  formComponents: { SubmitButton },
});

export default function TsfTextareaFieldExample() {
  const form = useAppForm({
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
      <form.AppField
        name='bio'
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'Bio is required';
            if (value.length < 20) return 'Bio must be at least 20 characters';
            return undefined;
          },
        }}
        children={(field) => (
          <field.TextareaField
            label='Biography'
            description='Tell us about yourself'
            props={{ rows: 4, placeholder: 'Software engineer passionate about...' }}
          />
        )}
      />

      <form.AppField
        name='feedback'
        children={(field) => (
          <field.TextareaField
            label='Feedback'
            description='Share your thoughts or suggestions'
            props={{ rows: 6, placeholder: 'Your feedback helps us improve...' }}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Submit</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
