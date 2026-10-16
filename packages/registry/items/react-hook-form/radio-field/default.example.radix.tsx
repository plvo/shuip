'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { RadioField } from '@/components/ui/shuip/react-hook-form/radio-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  selection: z.enum(['Yes', 'No', 'Maybe', 'Not sure']),
});

type FormValues = { selection: string };
type SubmitValues = z.infer<typeof zodSchema>;

export default function RadioFieldExample() {
  const form = useForm<FormValues, unknown, SubmitValues>({
    defaultValues: {
      selection: 'Yes',
    },
    resolver: zodResolver<FormValues, unknown, SubmitValues>(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: SubmitValues) {
    try {
      alert(`Selection: ${values.selection}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
      <RadioField
        lens={lens.focus('selection')}
        options={['Yes', 'No', 'Maybe', 'Not sure']}
        label='Are you sure?'
        description='This is a description'
      />
      <SubmitButton>Check</SubmitButton>
    </form>
  );
}
