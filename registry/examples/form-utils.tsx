'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getChangedFields, getZodDefaultValues } from '@/lib/shuip/form-utils';
import React from 'react';
import { InputField } from '@/components/ui/shuip/input-field';
import { Form } from '@/components/ui/form';
import { SelectField } from '@/components/ui/shuip/select-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';
import { RadioField } from '@/components/ui/shuip/radio-field';

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
  status: z.nativeEnum({ ACTIVE: 'active', INACTIVE: 'inactive' }).optional(),
});

type MyZodSchema = z.infer<typeof zodSchema>;

export default function FormUtilsExample() {
  const [changedFields, setChangedFields] = React.useState<Partial<MyZodSchema>>();

  const form = useForm<z.infer<typeof zodSchema>>({
    resolver: zodResolver(zodSchema),
    defaultValues: getZodDefaultValues(zodSchema, {
      name: 'John Doe',
      age: 25,
      status: 'inactive',
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
          <InputField control={form.control} name='name' label='name' placeholder='Your Name' />
          <InputField control={form.control} type='number' name='age' label='age' placeholder='Your Age' />
          <RadioField control={form.control} name='role' label='role' values={['admin', 'user']} />
          <SelectField
            control={form.control}
            name='status'
            label='status'
            values={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <InputField
            control={form.control}
            type='date'
            name='createdAt'
            label='createdAt'
            placeholder='Your Created At'
          />
          <InputField control={form.control} name='address.street' label='address.street' placeholder='Your Street' />
          <InputField control={form.control} name='address.city' label='address.city' placeholder='Your City' />
          <InputField control={form.control} name='address.zip' label='address.zip' placeholder='Your Zip' />
          <InputField control={form.control} name='address.state' label='address.state' placeholder='Your State' />

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
