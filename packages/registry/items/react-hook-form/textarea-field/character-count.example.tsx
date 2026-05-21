'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { TextareaField } from '@/components/ui/shuip/react-hook-form/textarea-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const MAX_LENGTH = 280;

const zodSchema = z.object({
  tweet: z.string().min(1, 'Tweet cannot be empty').max(MAX_LENGTH, `Tweet is too long (max ${MAX_LENGTH} characters)`),
});

type Values = z.infer<typeof zodSchema>;

export default function RhfTextareaFieldCharacterCountExample() {
  const form = useForm<Values>({
    defaultValues: { tweet: '' },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  const tweet = form.watch('tweet') ?? '';
  const remaining = MAX_LENGTH - tweet.length;
  const isNearLimit = remaining < 50;
  const isOverLimit = remaining < 0;

  async function onSubmit(values: Values) {
    try {
      alert(`Tweet: ${values.tweet}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 w-full max-w-lg'>
        <div className='space-y-2'>
          <TextareaField
            lens={lens.focus('tweet')}
            label='Tweet'
            rows={4}
            maxLength={MAX_LENGTH}
            placeholder="What's happening?"
          />

          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>
              {tweet.length} / {MAX_LENGTH} characters
            </span>
            <span
              className={`font-medium ${
                isOverLimit ? 'text-destructive' : isNearLimit ? 'text-orange-500' : 'text-muted-foreground'
              }`}
            >
              {remaining} remaining
            </span>
          </div>
        </div>

        <SubmitButton>Post Tweet</SubmitButton>
      </form>
    </Form>
  );
}
