'use client';

import { Form } from '@/components/ui/form';
import { SelectField, type SelectFieldOption } from '@/components/ui/shuip/select-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const zodSchema = z.object({
  selection: z.enum(['1', '2', '3']),
});

const values: SelectFieldOption[] = [
  { label: 'First', value: '1' },
  { label: 'Second', value: '2' },
  { label: 'Third', value: '3' },
];

export default function SelectFieldExample() {
  const form = useForm({
    defaultValues: {
      selection: '1' as const,
    },
    resolver: zodResolver(zodSchema),
  });

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(`Selection: ${values.selection}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <SelectField
          control={form.control}
          placeholder='Select an option'
          name='selection'
          label='selection'
          values={values}
        />
        <SubmitButton>Check</SubmitButton>
      </form>
    </Form>
  );
}
