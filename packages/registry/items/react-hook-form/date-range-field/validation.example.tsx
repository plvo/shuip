'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { DateRangeField } from '@/components/ui/shuip/react-hook-form/date-range-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z
  .object({
    range: z
      .object({
        from: z.date({ message: 'Start date is required' }),
        to: z.date({ message: 'End date is required' }),
      })
      .refine((value) => value.to >= value.from, {
        message: 'End date must be on or after the start date',
        path: ['to'],
      }),
  })
  .required();

type Values = z.infer<typeof zodSchema>;

export default function RhfDateRangeFieldValidationExample() {
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
          label='Booking window'
          description='Both dates are required and end date must be after start date'
          placeholder='Select start and end dates'
          minDate={new Date()}
        />
        <SubmitButton>Book</SubmitButton>
      </form>
    </Form>
  );
}
