'use client';

import { useLens } from '@hookform/lenses';
import { FormProvider, useForm } from 'react-hook-form';
import { ComboboxField, type ComboboxOption } from '@/components/ui/shuip/react-hook-form/combobox-field';

const COUNTRIES: ComboboxOption[] = [
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'es', label: 'Spain' },
  { value: 'it', label: 'Italy' },
  { value: 'pt', label: 'Portugal' },
];

type Values = { small: string; normal: string };

const PRESET: ComboboxOption = { value: 'fr', label: 'France' };

export default function ComboboxFieldSizesExample() {
  const form = useForm<Values>({
    defaultValues: { small: 'fr', normal: 'fr' },
  });
  const lens = useLens({ control: form.control });

  return (
    <FormProvider {...form}>
      <form className='space-y-4'>
        <ComboboxField
          size='sm'
          lens={lens.focus('small')}
          label='Small'
          placeholder='Search a country…'
          options={COUNTRIES}
          defaultSelected={PRESET}
        />
        <ComboboxField
          size='default'
          lens={lens.focus('normal')}
          label='Default'
          placeholder='Search a country…'
          options={COUNTRIES}
          defaultSelected={PRESET}
        />
      </form>
    </FormProvider>
  );
}
