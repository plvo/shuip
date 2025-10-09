/** biome-ignore-all lint/correctness/noChildrenProp: <explanation> */
'use client';

import { formOptions, mergeForm, useForm, useStore, useTransform } from '@tanstack/react-form';
import { initialFormState } from '@tanstack/react-form/nextjs';
import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';
import { useActionState } from 'react';
import { z } from 'zod';
import { getData, mutaction } from './actions';

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

  const [state, action] = useActionState(mutaction, initialFormState);

  const form = useForm({
    ...opts,
    transform: useTransform((baseForm) => mergeForm(baseForm, state!), [state]),
    validators: {
      onSubmit: schema,
    },
  });

  //   const mutation = useMutation({
  //     mutationFn: action,
  //   });

  //   const form = useForm({
  //     ...opts,
  //     onSubmit: async ({ value, formApi }) => {
  //       await mutation.mutateAsync(value);

  //       await nameResult.refetch();

  //       formApi.reset(value);
  //     },

  //     validators: {
  //       onSubmit: schema,
  //     },
  //   });
  //   const ddform = useFormRhf({});

  const values = useStore(form.store, (state) => state.values);
  const formState = useStore(form.store, (state) => state);

  return (
    <div className='flex flex-col gap-4 justify-between w-screen'>
      <form
        action={action}
        onSubmit={form.handleSubmit}
        // onSubmit={(e) => {
        //   e.preventDefault();
        //   form.handleSubmit();
        // }}
      >
        <form.Field
          name='name'
          children={(field) => {
            return (
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type='text'
              />
            );
          }}
        />
        <form.Subscribe selector={(formState) => [formState.canSubmit, formState.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <button type='submit' disabled={!canSubmit}>
              {isSubmitting ? '...' : 'Submit'}
            </button>
          )}
        </form.Subscribe>
      </form>

      <pre>{JSON.stringify({ state, action, values, formState }, null, 2)}</pre>
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
