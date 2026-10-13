'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { TimeRangeField } from '@/components/ui/shuip/react-hook-form/time-range';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z
  .object({
    slot: z.object({
      start: z.string(),
      end: z.string(),
    }),
  })
  .refine((values) => Boolean(values.slot.start && values.slot.end && values.slot.start < values.slot.end), {
    message: 'Select a start and end time (end after start)',
    path: ['slot'],
  });

type Values = z.infer<typeof zodSchema>;

export default function RhfTimeRangeExample() {
  const form = useForm<Values>({
    defaultValues: { slot: { start: '', end: '' } },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    try {
      alert(`From ${values.slot.start} to ${values.slot.end}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <TimeRangeField lens={lens.focus('slot')} label='Meeting slot' description='Pick a start and end time' />
        <SubmitButton>Save</SubmitButton>
      </form>
    </Form>
  );
}
