'use client';

import { createFormHook } from '@tanstack/react-form';
import * as React from 'react';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { InlineEditField } from '@/components/ui/shuip/tanstack-form/inline-edit';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InlineEditField },
  formComponents: {},
});

const schema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  email: z.string().email({ message: 'Enter a valid email' }),
  role: z.string().min(2, { message: 'Role is required' }),
  bio: z.string().max(160, { message: 'Keep it under 160 characters' }),
});

type Values = z.infer<typeof schema>;

const STORAGE_KEY = 'shuip:tsf-inline-edit:profile';
const defaultValues: Values = {
  name: 'Ada Lovelace',
  email: 'ada.lovelace@example.com',
  role: 'Lead Mathematician',
  bio: 'First to publish an algorithm intended for a machine.',
};

function loadStored(): Partial<Values> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Values>) : {};
  } catch {
    return {};
  }
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

export default function TsfInlineEditProfileExample() {
  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    },
  });

  React.useEffect(() => {
    form.reset({ ...defaultValues, ...loadStored() });
  }, [form]);

  return (
    <Card className='w-full max-w-md'>
      <CardHeader className='flex-row items-center gap-4 space-y-0'>
        <form.Subscribe selector={(state) => state.values.name}>
          {(name) => (
            <div className='bg-muted flex size-12 items-center justify-center rounded-full text-sm font-medium'>
              {initials(name)}
            </div>
          )}
        </form.Subscribe>
        <div className='space-y-1'>
          <CardTitle>Account</CardTitle>
          <CardDescription>Click any value to edit — changes save as you go.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className='flex flex-col gap-3'>
        <form.AppField
          name='name'
          validators={{ onChange: schema.shape.name }}
          children={(field) => <field.InlineEditField label='Name' orientation='horizontal' />}
        />
        <Separator />
        <form.AppField
          name='email'
          validators={{ onChange: schema.shape.email }}
          children={(field) => <field.InlineEditField label='Email' orientation='horizontal' />}
        />
        <Separator />
        <form.AppField
          name='role'
          validators={{ onChange: schema.shape.role }}
          children={(field) => (
            <field.InlineEditField label='Role' orientation='horizontal' description='Shown on your public profile.' />
          )}
        />
        <Separator />
        <form.AppField
          name='bio'
          validators={{ onChange: schema.shape.bio }}
          children={(field) => <field.InlineEditField label='Bio' input='textarea' placeholder='Add a short bio' />}
        />
      </CardContent>
    </Card>
  );
}
