'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { DatetimeField } from '@/components/ui/shuip/react-hook-form/datetime-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  scheduledAt: z.date({ message: 'Pick a date & time' }),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfDatetimeFieldExample() {
  const form = useForm<Values>({
    defaultValues: { scheduledAt: undefined },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    alert(`Scheduled at: ${values.scheduledAt.toISOString()}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <DatetimeField
          lens={lens.focus('scheduledAt')}
          label='Scheduled at'
          description='Pick a date and a time of day.'
        />
        <SubmitButton>Schedule</SubmitButton>
      </form>
    </Form>
  );
}
