'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { TimeField } from '@/components/ui/shuip/react-hook-form/time-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  meetingTime: z.string().min(1, 'Time is required'),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfTimeFieldExample() {
  const form = useForm<Values>({
    defaultValues: { meetingTime: '' },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    try {
      alert(`Meeting at ${values.meetingTime}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <TimeField lens={lens.focus('meetingTime')} label='Meeting time' description='Pick a time' />
        <SubmitButton>Save</SubmitButton>
      </form>
    </Form>
  );
}
