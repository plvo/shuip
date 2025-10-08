'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { SelectField, type SelectFieldOption } from '@/components/ui/shuip/react-hook-form/select-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const options: SelectFieldOption = {
  First: '1',
  Second: '2',
  Third: '3',
  Fourth: '4',
};

const zodSchema = z.object({
  selection: z.enum(Object.values(options) as [string]),
});

export default function SelectFieldExample() {
  const form = useForm({
    defaultValues: {
      selection: '1',
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
          register={form.register('selection')}
          placeholder='Select an option'
          label='selection'
          options={options}
          defaultValue={'3'}
        />
        <SubmitButton>Check</SubmitButton>
      </form>
    </Form>
  );
}
