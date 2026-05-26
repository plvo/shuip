'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { InlineEditField } from '@/components/ui/shuip/react-hook-form/inline-edit';

const schema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  email: z.string().email({ message: 'Enter a valid email' }),
  role: z.string().min(2, { message: 'Role is required' }),
  bio: z.string().max(160, { message: 'Keep it under 160 characters' }),
});

type Values = z.infer<typeof schema>;

const STORAGE_KEY = 'shuip:rhf-inline-edit:profile';
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

export default function RhfInlineEditProfileExample() {
  const form = useForm<Values>({ defaultValues, resolver: zodResolver(schema), mode: 'onChange' });
  const lens = useLens({ control: form.control });
  const name = form.watch('name');

  React.useEffect(() => {
    form.reset({ ...defaultValues, ...loadStored() });
    const subscription = form.watch((values) => {
      const parsed = schema.safeParse(values);
      if (parsed.success) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Form {...form}>
      <Card className='w-full max-w-md'>
        <CardHeader className='flex-row items-center gap-4 space-y-0'>
          <div className='bg-muted flex size-12 items-center justify-center rounded-full text-sm font-medium'>
            {initials(name)}
          </div>
          <div className='space-y-1'>
            <CardTitle>Account</CardTitle>
            <CardDescription>Click any value to edit — changes save as you go.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          <InlineEditField lens={lens.focus('name')} label='Name' orientation='horizontal' />
          <Separator />
          <InlineEditField lens={lens.focus('email')} label='Email' orientation='horizontal' />
          <Separator />
          <InlineEditField
            lens={lens.focus('role')}
            label='Role'
            orientation='horizontal'
            description='Shown on your public profile.'
          />
          <Separator />
          <InlineEditField lens={lens.focus('bio')} label='Bio' input='textarea' placeholder='Add a short bio' />
        </CardContent>
      </Card>
    </Form>
  );
}
