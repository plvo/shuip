'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { TimeField } from '@/components/ui/shuip/react-hook-form/time-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const BUSINESS_OPEN = '09:00';
const BUSINESS_CLOSE = '18:00';

const zodSchema = z.object({
  appointment: z
    .string()
    .min(1, 'Time is required')
    .refine((value) => value >= BUSINESS_OPEN && value <= BUSINESS_CLOSE, {
      message: `Appointment must be between ${BUSINESS_OPEN} and ${BUSINESS_CLOSE}`,
    }),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfTimeFieldValidationExample() {
  const form = useForm<Values>({
    defaultValues: { appointment: '' },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    try {
      alert(`Appointment at ${values.appointment}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <TimeField
          lens={lens.focus('appointment')}
          label='Appointment'
          description={`Office hours: ${BUSINESS_OPEN} – ${BUSINESS_CLOSE}`}
          min={BUSINESS_OPEN}
          max={BUSINESS_CLOSE}
        />
        <SubmitButton>Book</SubmitButton>
      </form>
    </Form>
  );
}
