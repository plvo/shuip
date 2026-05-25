'use client';

import { createFormHook } from '@tanstack/react-form';
import { AutocompleteField } from '@/components/ui/shuip/tanstack-form/autocomplete-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Blackberry', 'Blueberry', 'Cherry', 'Mango', 'Melon', 'Orange', 'Peach'];

async function searchFruits(query: string): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return FRUITS.filter((fruit) => fruit.toLowerCase().includes(query.toLowerCase()));
}

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { AutocompleteField },
  formComponents: { SubmitButton },
});

export default function TsfAutocompleteFieldAsyncExample() {
  const form = useAppForm({
    defaultValues: {
      fruit: '',
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
        name='fruit'
        children={(field) => (
          <field.AutocompleteField
            label='Fruit'
            description='Async search with simulated latency'
            placeholder='Search a fruit…'
            onSearch={searchFruits}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Submit</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
