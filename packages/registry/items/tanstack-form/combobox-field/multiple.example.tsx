'use client';

import { createFormHook } from '@tanstack/react-form';
import { ComboboxField, type ComboboxOption } from '@/components/ui/shuip/tanstack-form/combobox-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const FRAMEWORKS: ComboboxOption[] = [
  { value: 'next', label: 'Next.js', sublabel: 'React framework' },
  { value: 'remix', label: 'Remix', sublabel: 'React framework' },
  { value: 'astro', label: 'Astro', sublabel: 'Content-driven' },
  { value: 'svelte', label: 'SvelteKit', sublabel: 'Svelte framework' },
  { value: 'nuxt', label: 'Nuxt', sublabel: 'Vue framework' },
  { value: 'solid', label: 'SolidStart', sublabel: 'Solid framework' },
];

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { ComboboxField },
  formComponents: { SubmitButton },
});

export default function TsfComboboxFieldMultipleExample() {
  const form = useAppForm({
    defaultValues: {
      frameworks: ['next'] as string[],
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
        name='frameworks'
        validators={{
          onChange: ({ value }) => (value.length === 0 ? 'Pick at least one framework' : undefined),
        }}
        children={(field) => (
          <field.ComboboxField
            multiple
            label='Frameworks'
            description='Pick several; backspace removes the last chip'
            placeholder='Search frameworks…'
            options={FRAMEWORKS}
            defaultSelected={[{ value: 'next', label: 'Next.js', sublabel: 'React framework' }]}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Submit</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
