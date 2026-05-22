'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { TextareaField } from '@/components/ui/shuip/react-hook-form/textarea-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  bio: z.string().min(20, 'Bio must be at least 20 characters'),
  feedback: z.string().max(500, 'Maximum 500 characters'),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfTextareaFieldExample() {
  const form = useForm<Values>({
    defaultValues: { bio: '', feedback: '' },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    try {
      alert(`Bio: ${values.bio}\nFeedback: ${values.feedback}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <TextareaField
          lens={lens.focus('bio')}
          label='Biography'
          description='Tell us about yourself'
          rows={4}
          placeholder='Software engineer passionate about...'
        />

        <TextareaField
          lens={lens.focus('feedback')}
          label='Feedback'
          description='Share your thoughts (max 500 characters)'
          rows={6}
          maxLength={500}
          placeholder='Your feedback...'
        />

        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
