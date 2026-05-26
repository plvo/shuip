'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InlineEditField } from '@/components/ui/shuip/react-hook-form/inline-edit';

const schema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  owner: z.string().min(2, { message: 'Owner is required' }),
});

type Values = z.infer<typeof schema>;

const STORAGE_KEY = 'shuip:rhf-inline-edit';
const defaultValues: Values = { title: 'Project Apollo', owner: 'Ada Lovelace' };

function loadStored(): Partial<Values> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Values>) : {};
  } catch {
    return {};
  }
}

export default function RhfInlineEditExample() {
  const form = useForm<Values>({ defaultValues, resolver: zodResolver(schema), mode: 'onChange' });
  const lens = useLens({ control: form.control });
  const [stored, setStored] = React.useState(() => JSON.stringify(defaultValues));

  React.useEffect(() => {
    form.reset({ ...defaultValues, ...loadStored() });
    const subscription = form.watch((values) => {
      const json = JSON.stringify(values);
      window.localStorage.setItem(STORAGE_KEY, json);
      setStored(json);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Form {...form}>
      <div className='flex w-full max-w-sm flex-col gap-4'>
        <InlineEditField lens={lens.focus('title')} label='Title' description='Shown at the top of the project page.' />
        <InlineEditField lens={lens.focus('owner')} label='Owner' orientation='horizontal' />
        <p className='text-muted-foreground text-xs'>
          Persisted to localStorage: <code className='text-foreground'>{stored}</code>
        </p>
      </div>
    </Form>
  );
}
