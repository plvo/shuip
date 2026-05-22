'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { DateField } from '@/components/ui/shuip/react-hook-form/date-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const today = new Date();
today.setHours(0, 0, 0, 0);

const oneYearFromNow = new Date(today);
oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

const zodSchema = z.object({
  appointment: z
    .date({ message: 'Pick an appointment date' })
    .min(today, 'Appointment must be in the future')
    .max(oneYearFromNow, 'Appointment must be within a year'),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfDateFieldValidationExample() {
  const form = useForm<Values>({
    defaultValues: { appointment: undefined as unknown as Date },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    alert(`Appointment: ${values.appointment.toLocaleDateString()}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <DateField
          lens={lens.focus('appointment')}
          label='Appointment'
          description='Within the next 12 months'
          minDate={today}
          maxDate={oneYearFromNow}
        />
        <SubmitButton>Book</SubmitButton>
      </form>
    </Form>
  );
}
