'use client';

import { formOptions, useStore } from '@tanstack/react-form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { z } from 'zod';
import { useAppForm } from '../tu/hooks';

export const queryClient = new QueryClient();

export const opts = formOptions({
  defaultValues: {
    tooup: '',
  },
});

const schema = z.object({
  tooup: z.string().min(1),
});

function Content() {
  const form = useAppForm({
    ...opts,
    validators: {
      onSubmit: schema,
      onChange: schema,
    },
    onSubmit: async ({ value, meta }) => {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      alert(JSON.stringify({ value, meta }));
      form.reset();
    },
  });

  const values = useStore(form.store, (state) => state.values);

  return (
    <div className='flex flex-col gap-4 mx-auto max-w-md justify-center items-center h-screen'>
      <form
        className='space-y-4 w-full'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.AppForm>
          <form.AppField name='tooup' children={(f) => <f.InputField label='tooup' />} />
          <form.SubmitButton children='Submit ta mere' />
        </form.AppForm>
      </form>

      <pre>{JSON.stringify({ values }, null, 2)}</pre>
    </div>
  );
}

export default function TuPage2() {
  return (
    <QueryClientProvider client={queryClient}>
      <Content />
    </QueryClientProvider>
  );
}
