'use client';

import { createFormHook } from '@tanstack/react-form';
import { ComboboxField, type ComboboxOption } from '@/components/ui/shuip/tanstack-form/combobox-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';

const FRAMEWORKS: ComboboxOption[] = [
  { value: 'next', label: 'Next.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'svelte', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'solid', label: 'SolidStart' },
];

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { ComboboxField },
  formComponents: {},
});

export default function TsfComboboxFieldVariantsExample() {
  const form = useAppForm({
    defaultValues: {
      boxed: ['next'] as string[],
      ghost: ['next', 'remix'] as string[],
    },
  });

  return (
    <form className='space-y-4'>
      <form.AppField
        name='boxed'
        children={(field) => (
          <field.ComboboxField
            multiple
            variant='boxed'
            label='Boxed (default)'
            placeholder='Search frameworks…'
            options={FRAMEWORKS}
            defaultSelected={[{ value: 'next', label: 'Next.js' }]}
          />
        )}
      />
      <form.AppField
        name='ghost'
        children={(field) => (
          <field.ComboboxField
            multiple
            variant='ghost'
            label='Ghost (borderless — chips only)'
            placeholder='Search frameworks…'
            options={FRAMEWORKS}
            defaultSelected={[
              { value: 'next', label: 'Next.js' },
              { value: 'remix', label: 'Remix' },
            ]}
          />
        )}
      />
    </form>
  );
}
