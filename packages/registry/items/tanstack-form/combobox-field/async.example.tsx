'use client';

import { createFormHook } from '@tanstack/react-form';
import { ComboboxField, type ComboboxOption } from '@/components/ui/shuip/tanstack-form/combobox-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const USERS: ComboboxOption[] = [
  { value: 'u1', label: 'Ada Lovelace', sublabel: 'ada@example.com' },
  { value: 'u2', label: 'Alan Turing', sublabel: 'alan@example.com' },
  { value: 'u3', label: 'Grace Hopper', sublabel: 'grace@example.com' },
  { value: 'u4', label: 'Katherine Johnson', sublabel: 'katherine@example.com' },
  { value: 'u5', label: 'Margaret Hamilton', sublabel: 'margaret@example.com' },
  { value: 'u6', label: 'Linus Torvalds', sublabel: 'linus@example.com' },
];

const RECENT_IDS = ['u3', 'u1'];

async function searchUsers(query: string): Promise<ComboboxOption[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (!query) return USERS.filter((user) => RECENT_IDS.includes(user.value));
  return USERS.filter((user) => user.label.toLowerCase().includes(query.toLowerCase()));
}

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { ComboboxField },
  formComponents: { SubmitButton },
});

export default function TsfComboboxFieldAsyncExample() {
  const form = useAppForm({
    defaultValues: {
      assignee: '',
    },
    onSubmit: async ({ value }) => {
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
        name='assignee'
        validators={{
          onChange: ({ value }) => (value.length === 0 ? 'Assignee is required' : undefined),
        }}
        children={(field) => (
          <field.ComboboxField
            label='Assignee'
            description='Empty query returns recents; typing searches'
            placeholder='Search a user…'
            onSearch={searchUsers}
            maxResults={5}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Submit</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
