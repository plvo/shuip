'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { MonthField } from '@/components/ui/shuip/react-hook-form/month-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  billingMonth: z.date({ message: 'Pick a billing month' }),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfMonthFieldExample() {
  const form = useForm<Values>({
    defaultValues: { billingMonth: undefined as unknown as Date },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    alert(
      `Billing month: ${values.billingMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}\nISO: ${values.billingMonth.toISOString()}`,
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <MonthField
          lens={lens.focus('billingMonth')}
          label='Billing month'
          description='The first day of the selected month is stored.'
        />
        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
