'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { AutocompleteField } from '@/components/ui/shuip/react-hook-form/autocomplete-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const SOURCES = ['LinkedIn', 'IRL', 'Prospection', 'Referral', 'Website', 'Cold call'];

const zodSchema = z.object({
  source: z.string().nonempty({ message: 'Source is required' }),
});

type Values = z.infer<typeof zodSchema>;

export default function AutocompleteFieldExample() {
  const form = useForm<Values>({
    defaultValues: { source: '' },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  function onSubmit(values: Values) {
    alert(`Source: ${values.source}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <AutocompleteField
          lens={lens.focus('source')}
          label='Source'
          description='Pick a known source or type your own'
          placeholder='e.g. LinkedIn'
          suggestions={SOURCES}
        />
        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
