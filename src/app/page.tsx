'use client';

import { useForm } from '@tanstack/react-form';
import { InputField } from '#/registry/ui/tsf-input-field';
import { SubmitButton } from '#/registry/ui/tsf-submit-button';

export default function HomePage() {
  const form = useForm({
    defaultValues: {
      password: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <InputField
          form={form}
          name='password'
          label='Email'
          tooltip='Enter your email'
          fieldProps={{ orientation: 'responsive' }}
        />

        <SubmitButton form={form}>Submit</SubmitButton>
      </form>
    </main>
  );
}
