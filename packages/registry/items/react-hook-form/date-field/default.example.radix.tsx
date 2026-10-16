'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DateField } from '@/components/ui/shuip/react-hook-form/date-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  dueDate: z.date({ message: 'Pick a due date' }),
});

type FormValues = { dueDate: Date | undefined };
type SubmitValues = z.infer<typeof zodSchema>;

export default function RhfDateFieldExample() {
  const form = useForm<FormValues, unknown, SubmitValues>({
    defaultValues: { dueDate: undefined },
    resolver: zodResolver<FormValues, unknown, SubmitValues>(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: SubmitValues) {
    alert(`Due date: ${values.dueDate.toISOString()}`);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
      <DateField lens={lens.focus('dueDate')} label='Due date' description='When should this task be done?' />
      <SubmitButton>Save</SubmitButton>
    </form>
  );
}
