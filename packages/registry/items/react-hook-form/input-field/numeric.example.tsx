'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  quantity: z.number().min(1, 'Must be at least 1'),
  ratio: z.number().min(0).max(1),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfInputFieldNumericExample() {
  const form = useForm<Values>({
    defaultValues: { quantity: 1, ratio: 0.5 },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    try {
      alert(`Quantity: ${values.quantity}\nRatio: ${values.ratio}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <InputField
          lens={lens.focus('quantity')}
          label='Quantity'
          description='Auto-detected numeric because defaultValues is a number'
          placeholder='1'
        />

        <InputField
          lens={lens.focus('ratio')}
          type='range'
          label='Ratio'
          description='Rendered as a range slider'
          min={0}
          max={1}
          step={0.1}
        />

        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
