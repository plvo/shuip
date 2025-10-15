'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { InputField } from '#/registry/ui/rhf-input-field';
import { PasswordField } from '#/registry/ui/rhf-password-field';
import { SelectField } from '#/registry/ui/rhf-select-field';
import { SubmitButton } from '#/registry/ui/submit-button';
import { Form } from '@/components/ui/form';

('');

import { useForm as useTanForm } from '@tanstack/react-form';
import { InputField as TsfInputField } from '#/registry/ui/tsf-input-field';
import { PasswordField as TsfPasswordField } from '#/registry/ui/tsf-password-field';
import { SelectField as TsfSelectField } from '#/registry/ui/tsf-select-field';
import { SubmitButton as TsfSubmitButton } from '#/registry/ui/tsf-submit-button';

const options = {
  First: '1',
  Second: '2',
  Third: '3',
  Fourth: '4',
};

export default function HomePage() {
  return (
    <main className='flex flex-col items-center justify-center h-screen gap-8'>
      <h1 className='text-4xl hover:text-amber-400'>
        <b>
          sh<span className='text-amber-400 hover:text-foreground'>ui</span>p
        </b>{' '}
      </h1>
      <p className='text-muted-foreground'>
        🚀 Ship fast with sh(ui)p components, a collection of UI components for your next.js project, built with
        shadcn/ui
      </p>

      <div className='flex flex-col gap-2 justify-center items-center'>
        <a href='https://github.com/plvo/shuip' className='hover:underline underline-offset-4'>
          github.com/plvo/shuip
        </a>
        <a href='/docs' className='hover:underline underline-offset-4'>
          /docs
        </a>
      </div>

      <RHFForm />
      <TSFForm />
    </main>
  );
}

function RHFForm() {
  const form = useForm<{ password: string; name: string; selection: string }>({
    defaultValues: {
      password: '',
      name: '',
      selection: '',
    },
    resolver: zodResolver(
      z.object({
        password: z.string().nonempty({ message: 'Password is required' }).max(10),
        name: z.string().nonempty({ message: 'Name is required' }),
        selection: z.string().nonempty({ message: 'Selection is required' }),
      }),
    ),
  });

  async function onSubmit(values: { password: string; name: string; selection: string }) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(JSON.stringify(values, null, 2));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 max-w-xs border-2 border-red-500'>
        <PasswordField register={form.register('password')} description='Your password' />
        <InputField register={form.register('name')} label='yOUR Name' description='Your name' placeholder='John' />
        <SelectField register={form.register('selection')} description='Your selection' options={options} />
        <SubmitButton></SubmitButton>
      </form>
    </Form>
  );
}

function TSFForm() {
  const form = useTanForm({
    defaultValues: {
      name: '',
      password: '',
      selection: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4 max-w-xs border-2 border-blue-500'
    >
      <TsfInputField
        form={form}
        name='name'
        label='Your name'
        description='Your name'
        formProps={{
          validators: {
            onChange: ({ value }) => (value.length < 3 ? 'Name must be at least 3 characters' : undefined),
          },
        }}
      />
      <TsfPasswordField
        form={form}
        name='password'
        label='Your password'
        description='Your password'
        formProps={{
          validators: {
            onChange: ({ value }) => (value.length < 8 ? 'Password must be at least 8 characters' : undefined),
          },
        }}
      />
      <TsfSelectField
        form={form}
        name='selection'
        description='Your selection'
        options={options}
        formProps={{
          validators: {
            onChange: ({ value }) => (value === '2' ? 'Selection muste be not 2' : undefined),
          },
        }}
      />

      <TsfSubmitButton form={form} />
    </form>
  );
}
