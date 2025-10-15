'use client';

import { useForm, useStore } from '@tanstack/react-form';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';
import { TextareaField } from '@/components/ui/shuip/tanstack-form/textarea-field';

const MAX_LENGTH = 280;

export default function TsfTextareaFieldCharacterCountExample() {
  const form = useForm({
    defaultValues: {
      tweet: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  const tweet = useStore(form.store, (state) => state.values.tweet);
  const remaining = MAX_LENGTH - tweet.length;
  const isNearLimit = remaining < 50;
  const isOverLimit = remaining < 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4 w-full max-w-lg'
    >
      <div className='space-y-2'>
        <TextareaField
          form={form}
          name='tweet'
          label='Tweet'
          props={{
            rows: 4,
            maxLength: MAX_LENGTH,
            placeholder: "What's happening?",
          }}
          formProps={{
            validators: {
              onChange: ({ value }) => {
                if (!value) return 'Tweet cannot be empty';
                if (value.length > MAX_LENGTH) return `Tweet is too long (max ${MAX_LENGTH} characters)`;
                return undefined;
              },
            },
          }}
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

      <SubmitButton form={form}>Post Tweet</SubmitButton>
    </form>
  );
}
