'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { DateField } from '@/components/ui/shuip/react-hook-form/date-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  dueDate: z.date({ message: 'Pick a due date' }),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfDateFieldExample() {
  const form = useForm<Values>({
    defaultValues: { dueDate: undefined as unknown as Date },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    alert(`Due date: ${values.dueDate.toISOString()}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <DateField lens={lens.focus('dueDate')} label='Due date' description='When should this task be done?' />
        <SubmitButton>Save</SubmitButton>
      </form>
    </Form>
  );
}
