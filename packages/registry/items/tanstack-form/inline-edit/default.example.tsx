'use client';

import { createFormHook } from '@tanstack/react-form';
import * as React from 'react';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { InlineEditField } from '@/components/ui/shuip/tanstack-form/inline-edit';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InlineEditField },
  formComponents: {},
});

const STORAGE_KEY = 'shuip:tsf-inline-edit';
const defaultValues = { title: 'Project Apollo', owner: 'Ada Lovelace' };

function loadStored(): Partial<typeof defaultValues> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<typeof defaultValues>) : {};
  } catch {
    return {};
  }
}

export default function TsfInlineEditExample() {
  const [stored, setStored] = React.useState(() => JSON.stringify(defaultValues));
  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      const json = JSON.stringify(value);
      window.localStorage.setItem(STORAGE_KEY, json);
      setStored(json);
    },
  });

  React.useEffect(() => {
    const initial = { ...defaultValues, ...loadStored() };
    form.reset(initial);
    setStored(JSON.stringify(initial));
  }, [form]);

  return (
    <div className='flex w-full max-w-sm flex-col gap-4'>
      <form.AppField
        name='title'
        validators={{ onChange: ({ value }) => (value.length < 3 ? 'Title must be at least 3 characters' : undefined) }}
        children={(field) => (
          <field.InlineEditField label='Title' description='Shown at the top of the project page.' />
        )}
      />
      <form.AppField
        name='owner'
        validators={{ onChange: ({ value }) => (value.length < 2 ? 'Owner is required' : undefined) }}
        children={(field) => <field.InlineEditField label='Owner' orientation='horizontal' />}
      />
      <p className='text-muted-foreground text-xs'>
        Persisted to localStorage: <code className='text-foreground'>{stored}</code>
      </p>
    </div>
  );
}
