'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { TextareaField } from '@/components/ui/shuip/react-hook-form/textarea-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  notes: z.string().min(10, 'Notes must be at least 10 characters'),
});

export default function RhfTextareaFieldTooltipExample() {
  const form = useForm({
    defaultValues: { notes: '' },
    resolver: zodResolver(zodSchema),
  });

  async function onSubmit(values: z.infer<typeof zodSchema>) {
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
          register={form.register('notes')}
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
