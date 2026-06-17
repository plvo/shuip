'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { ComboboxField, type ComboboxOption } from '@/components/ui/shuip/react-hook-form/combobox-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const FRAMEWORKS: ComboboxOption[] = [
  { value: 'next', label: 'Next.js', sublabel: 'React framework' },
  { value: 'remix', label: 'Remix', sublabel: 'React framework' },
  { value: 'astro', label: 'Astro', sublabel: 'Content-driven' },
  { value: 'svelte', label: 'SvelteKit', sublabel: 'Svelte framework' },
  { value: 'nuxt', label: 'Nuxt', sublabel: 'Vue framework' },
  { value: 'solid', label: 'SolidStart', sublabel: 'Solid framework' },
];

const zodSchema = z.object({
  frameworks: z.array(z.string()).min(1, { message: 'Pick at least one framework' }),
});

type Values = z.infer<typeof zodSchema>;

function onSubmit(values: Values) {
  alert(`Frameworks: ${values.frameworks.join(', ')}`);
}

export default function ComboboxFieldMultipleExample() {
  const form = useForm<Values>({
    defaultValues: { frameworks: ['next'] },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <ComboboxField
          multiple
          lens={lens.focus('frameworks')}
          label='Frameworks'
          description='Pick several; backspace removes the last chip'
          placeholder='Search frameworks…'
          options={FRAMEWORKS}
          defaultSelected={[{ value: 'next', label: 'Next.js', sublabel: 'React framework' }]}
        />
        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
