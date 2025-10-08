'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { RadioField } from '@/components/ui/shuip/react-hook-form/radio-field';
import { SelectField } from '@/components/ui/shuip/react-hook-form/select-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';
import { getChangedFields, getZodDefaultValues } from '@/lib/shuip/rhf-utils';

const zodSchema = z.object({
  name: z.string(),
  age: z.number(),
  createdAt: z.date().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.number().optional(),
  }),
  role: z.enum(['admin', 'user']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

type MyZodSchema = z.infer<typeof zodSchema>;

export default function FormUtilsExample() {
  const [changedFields, setChangedFields] = React.useState<Partial<MyZodSchema>>();

  const form = useForm<z.infer<typeof zodSchema>>({
    resolver: zodResolver(zodSchema),
    defaultValues: getZodDefaultValues(zodSchema, {
      name: 'John Doe',
      age: 25,
      status: 'INACTIVE',
    }),
  });

  const handleSubmit = (data: MyZodSchema) => {
    const changed = getChangedFields(form.formState.defaultValues, data);
    setChangedFields(changed as Partial<MyZodSchema>);
    form.reset(data);
  };

  return (
    <div className='space-y-4 w-full'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='grid lg:grid-cols-2 gap-4'>
          <InputField register={form.register('name')} label='name' placeholder='Your Name' />
          <InputField register={form.register('age')} type='number' name='age' label='age' placeholder='Your Age' />
          <RadioField register={form.register('role')} label='role' options={['admin', 'user']} />
          <SelectField
            register={form.register('status')}
            label='status'
            options={{
              active: 'ACTIVE',
              inactive: 'INACTIVE',
            }}
          />
          <InputField
            register={form.register('createdAt')}
            type='date'
            name='createdAt'
            label='createdAt'
            placeholder='Your Created At'
          />
          <InputField register={form.register('address.street')} label='address.street' placeholder='Your Street' />
          <InputField register={form.register('address.city')} label='address.city' placeholder='Your City' />
          <InputField register={form.register('address.zip')} label='address.zip' placeholder='Your Zip' />
          <InputField register={form.register('address.state')} label='address.state' placeholder='Your State' />

          <SubmitButton
            className='lg:col-span-2'
            loading={form.formState.isSubmitting}
            disabled={!form.formState.isDirty}
          >
            Submit
          </SubmitButton>
        </form>
      </Form>
      <div className='grid lg:grid-cols-2 gap-4'>
        <pre className='border border-primary rounded-md p-4'>
          <h3 className='text-primary'>Form Values</h3>
          {JSON.stringify(form.getValues(), null, 2)}
        </pre>
        <pre className='border border-primary rounded-md p-4'>
          <h3 className='text-primary'>Changed Fields</h3>
          {JSON.stringify(changedFields, null, 2)}
        </pre>
      </div>
    </div>
  );
}
