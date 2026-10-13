'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { DatetimeField } from '@/components/ui/shuip/react-hook-form/datetime-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  startsAt: z
    .date({ message: 'Required' })
    .refine((date) => date.getTime() > Date.now(), { message: 'Must be in the future' }),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfDatetimeFieldValidationExample() {
  const form = useForm<Values>({
    defaultValues: { startsAt: undefined },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    alert(`Starts at: ${values.startsAt.toISOString()}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <DatetimeField
          lens={lens.focus('startsAt')}
          label='Starts at'
          description='Must be a future date and time.'
          minDate={new Date()}
        />
        <SubmitButton>Book</SubmitButton>
      </form>
    </Form>
  );
}
