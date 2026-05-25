'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { DateRangeField } from '@/components/ui/shuip/react-hook-form/date-range-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  range: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional(),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfDateRangeFieldExample() {
  const form = useForm<Values>({
    defaultValues: { range: undefined },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    alert(JSON.stringify(values, null, 2));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <DateRangeField
          lens={lens.focus('range')}
          label='Stay'
          description='Pick check-in and check-out dates'
          placeholder='Pick a date range'
        />
        <SubmitButton>Save</SubmitButton>
      </form>
    </Form>
  );
}
