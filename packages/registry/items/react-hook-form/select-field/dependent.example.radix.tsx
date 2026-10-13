'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { SelectField } from '@/components/ui/shuip/react-hook-form/select-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const COUNTRIES = {
  'United States': 'us',
  Canada: 'ca',
  Mexico: 'mx',
};

const STATES_BY_COUNTRY: Record<string, Record<string, string>> = {
  us: {
    California: 'ca',
    Texas: 'tx',
    'New York': 'ny',
    Florida: 'fl',
  },
  ca: {
    Ontario: 'on',
    Quebec: 'qc',
    'British Columbia': 'bc',
    Alberta: 'ab',
  },
  mx: {
    'Mexico City': 'cdmx',
    Jalisco: 'jal',
    'Nuevo León': 'nl',
  },
};

const zodSchema = z.object({
  country: z.string().min(1, 'Please select a country'),
  state: z.string().min(1, 'Please select a state'),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfSelectFieldDependentExample() {
  const [stateOptions, setStateOptions] = useState<Record<string, string>>({});

  const form = useForm<Values>({
    defaultValues: {
      country: '',
      state: '',
    },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  const country = form.watch('country');

  useEffect(() => {
    if (country && STATES_BY_COUNTRY[country]) {
      setStateOptions(STATES_BY_COUNTRY[country]);
    } else {
      setStateOptions({});
    }
    // Reset state field when country changes
    form.setValue('state', '');
  }, [country, form]);

  async function onSubmit(values: Values) {
    try {
      alert(JSON.stringify(values, null, 2));
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <SelectField
          lens={lens.focus('country')}
          options={COUNTRIES}
          label='Country'
          placeholder='Select a country'
          description='Choose your country'
        />

        <SelectField
          lens={lens.focus('state')}
          options={stateOptions}
          label='State / Province'
          placeholder={Object.keys(stateOptions).length === 0 ? 'Select a country first' : 'Select a state'}
          description='Choose your state or province'
        />

        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
