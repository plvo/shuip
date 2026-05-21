'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { CheckboxField } from '@/components/ui/shuip/react-hook-form/checkbox-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  checkbox: z.boolean().refine((val) => val === true, {
    message: 'Accept your destiny!',
  }),
});

type Values = z.infer<typeof zodSchema>;

export default function CheckboxFieldExample() {
  const form = useForm<Values>({
    defaultValues: { checkbox: false },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    try {
      alert(`Checkbox: ${values.checkbox}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <CheckboxField
          lens={lens.focus('checkbox')}
          label='Accept terms and conditions'
          description='To continue, you must accept the terms and conditions because tbh it says so'
        />
        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
