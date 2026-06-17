'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { ComboboxField, type ComboboxOption } from '@/components/ui/shuip/react-hook-form/combobox-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const COUNTRIES: ComboboxOption[] = [
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'es', label: 'Spain' },
  { value: 'it', label: 'Italy' },
  { value: 'pt', label: 'Portugal' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'be', label: 'Belgium' },
];

const zodSchema = z.object({
  country: z.string().nonempty({ message: 'Country is required' }),
});

type Values = z.infer<typeof zodSchema>;

function onSubmit(values: Values) {
  alert(`Country: ${values.country}`);
}

export default function ComboboxFieldExample() {
  const form = useForm<Values>({
    defaultValues: { country: 'fr' },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <ComboboxField
          lens={lens.focus('country')}
          label='Country'
          description='The preset value resolves its label at rest'
          placeholder='Search a country…'
          options={COUNTRIES}
          defaultSelected={{ value: 'fr', label: 'France' }}
        />
        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
