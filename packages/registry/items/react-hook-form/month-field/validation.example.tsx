'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { MonthField } from '@/components/ui/shuip/react-hook-form/month-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const startOfCurrentMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const zodSchema = z.object({
  startMonth: z
    .date({ message: 'Start month is required' })
    .refine((d) => d.getTime() >= startOfCurrentMonth().getTime(), {
      message: 'Must be the current month or later',
    }),
});

type FormValues = { startMonth: Date | undefined };
type SubmitValues = z.infer<typeof zodSchema>;

export default function RhfMonthFieldValidationExample() {
  const form = useForm<FormValues, unknown, SubmitValues>({
    defaultValues: { startMonth: undefined },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: SubmitValues) {
    alert(`Start month: ${values.startMonth.toISOString()}`);
  }

  const tenYearsFromNow = new Date();
  tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <MonthField
          lens={lens.focus('startMonth')}
          label='Subscription start'
          description='Past months are disabled in the calendar and rejected by Zod.'
          minDate={startOfCurrentMonth()}
          maxDate={tenYearsFromNow}
        />
        <SubmitButton>Start subscription</SubmitButton>
      </form>
    </Form>
  );
}
