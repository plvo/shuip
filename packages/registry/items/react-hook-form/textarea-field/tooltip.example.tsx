'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { TextareaField } from '@/components/ui/shuip/react-hook-form/textarea-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  notes: z.string().min(10, 'Notes must be at least 10 characters'),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfTextareaFieldTooltipExample() {
  const form = useForm<Values>({
    defaultValues: { notes: '' },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    try {
      alert(`Notes: ${values.notes}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <TextareaField
          lens={lens.focus('notes')}
          label='Notes'
          description='Add any additional notes or comments'
          tooltip={
            <div className='space-y-1 text-sm'>
              <p className='font-semibold'>Formatting tips:</p>
              <ul className='list-disc list-inside space-y-0.5'>
                <li>Keep it concise and clear</li>
                <li>Use bullet points for lists</li>
                <li>Mention important details first</li>
              </ul>
            </div>
          }
          rows={8}
          placeholder='Enter your notes here...'
        />

        <SubmitButton>Save Notes</SubmitButton>
      </form>
    </Form>
  );
}
