'use client';

import { formOptions, useStore } from '@tanstack/react-form';
import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { getData } from './actions';
import { useAppForm } from './hooks';

export const queryClient = new QueryClient();

export const opts = formOptions({
  defaultValues: {
    name: '',
  },
});

const schema = z.object({
  name: z.string().min(1),
});

function Content() {
  const nameResult = useQuery({
    queryKey: ['name'],
    queryFn: getData,
  });

  const form = useAppForm({
    ...opts,
    validators: {
      onSubmit: schema,
    },
    onSubmit: ({ value, meta }) => {
      alert(JSON.stringify({ value, meta }));
      form.reset();
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const formState = useStore(form.store, (state) => state);

  return (
    <div className='flex flex-col gap-4 mx-auto max-w-md justify-center items-center h-screen'>
      <form
        // action={action}
        // onSubmit={form.handleSubmit}

        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.AppField name='name' children={(f) => <f.InputField label='Name' />} />

        <form.Subscribe selector={(formState) => [formState.canSubmit, formState.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <button type='submit' disabled={!canSubmit}>
              {isSubmitting ? '...' : 'Submit'}
            </button>
          )}
        </form.Subscribe>
      </form>

      <pre>{JSON.stringify({ values, errs: form.state.errors }, null, 2)}</pre>
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
