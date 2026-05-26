'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { InlineEditField } from '@/components/ui/shuip/tanstack-form/inline-edit';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InlineEditField },
  formComponents: { SubmitButton },
});

export default function TsfInlineEditExample() {
  const form = useAppForm({
    defaultValues: { title: 'Project Apollo' },
    onSubmit: async ({ value }) => {
      alert(JSON.stringify(value, null, 2));
    },
  });

  async function saveTitle(next: string) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('saved', next);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='w-full max-w-sm space-y-4'
    >
      <form.AppField
        name='title'
        validators={{ onChange: ({ value }) => (value.length < 3 ? 'Title must be at least 3 characters' : undefined) }}
        children={(field) => (
          <field.InlineEditField
            label='Title'
            description='Shown at the top of the project page.'
            size='title'
            onSave={saveTitle}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Save</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
