'use client';

import { useLens } from '@hookform/lenses';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { ComboboxField, type ComboboxOption } from '@/components/ui/shuip/react-hook-form/combobox-field';

const FRAMEWORKS: ComboboxOption[] = [
  { value: 'next', label: 'Next.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'svelte', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'solid', label: 'SolidStart' },
];

type Values = { boxed: string[]; ghost: string[] };

export default function ComboboxFieldVariantsExample() {
  const form = useForm<Values>({
    defaultValues: { boxed: ['next'], ghost: ['next', 'remix'] },
  });
  const lens = useLens({ control: form.control });

  return (
    <Form {...form}>
      <form className='space-y-4'>
        <ComboboxField
          multiple
          variant='boxed'
          lens={lens.focus('boxed')}
          label='Boxed (default)'
          placeholder='Search frameworks…'
          options={FRAMEWORKS}
          defaultSelected={[{ value: 'next', label: 'Next.js' }]}
        />
        <ComboboxField
          multiple
          variant='ghost'
          lens={lens.focus('ghost')}
          label='Ghost (borderless — chips only)'
          placeholder='Search frameworks…'
          options={FRAMEWORKS}
          defaultSelected={[
            { value: 'next', label: 'Next.js' },
            { value: 'remix', label: 'Remix' },
          ]}
        />
      </form>
    </Form>
  );
}
