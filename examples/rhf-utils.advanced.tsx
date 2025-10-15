'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { RadioField } from '@/components/ui/shuip/react-hook-form/radio-field';
import { SelectField } from '@/components/ui/shuip/react-hook-form/select-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';
import { getChangedFields, getZodDefaultValues } from '@/lib/shuip/rhf-utils';

const zodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.coerce.number().min(18, 'Must be 18 or older'),
  createdAt: z.date().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.coerce.number().optional(),
  }),
  role: z.enum(['admin', 'user']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

type MyZodSchema = z.infer<typeof zodSchema>;

export default function RhfUtilsAdvancedExample() {
  const [changedFields, setChangedFields] = React.useState<Partial<MyZodSchema>>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: getZodDefaultValues(zodSchema, {
      name: 'John Doe',
      age: 25,
      status: 'INACTIVE',
    }),
  });

  // Watch for changes to detect unsaved changes
  React.useEffect(() => {
    const subscription = form.watch((value, { type }) => {
      if (type === 'change') {
        const changed = getChangedFields(form.formState.defaultValues, value);
        setHasUnsavedChanges(Object.keys(changed).length > 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = (data: MyZodSchema) => {
    const changed = getChangedFields(form.formState.defaultValues, data);
    setChangedFields(changed as Partial<MyZodSchema>);
    setHasUnsavedChanges(false);

    // Simulate API call with only changed fields
    console.log('Sending to API:', changed);
    alert(`Updated ${Object.keys(changed).length} field(s)`);

    // Update form defaults to new values
    form.reset(data);
  };

  const handleReset = () => {
    form.reset();
    setChangedFields(undefined);
    setHasUnsavedChanges(false);
  };

  return (
    <div className='space-y-4 w-full'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Advanced Form Utils</h2>
        {hasUnsavedChanges && <span className='text-sm text-orange-600 font-medium'>Unsaved changes</span>}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='grid lg:grid-cols-2 gap-4'>
          <InputField register={form.register('name')} label='Name' placeholder='Your Name' />
          <InputField register={form.register('age')} type='number' label='Age' placeholder='Your Age' />
          <RadioField register={form.register('role')} label='Role' options={['admin', 'user']} />

          <SelectField
            register={form.register('status')}
            label='Status'
            options={{
              Active: 'ACTIVE',
              Inactive: 'INACTIVE',
            }}
          />

          <InputField register={form.register('createdAt')} type='date' label='Created At' />
          <InputField register={form.register('address.street')} label='Street' placeholder='Street Address' />
          <InputField register={form.register('address.city')} label='City' placeholder='City' />
          <InputField register={form.register('address.state')} label='State' placeholder='State' />

          <div className='lg:col-span-2 flex gap-2'>
            <SubmitButton loading={form.formState.isSubmitting} disabled={!form.formState.isDirty}>
              Save Changes
            </SubmitButton>

            <Button type='button' variant='outline' onClick={handleReset} disabled={!hasUnsavedChanges}>
              Reset
            </Button>
          </div>
        </form>
      </Form>

      <div className='grid lg:grid-cols-2 gap-4'>
        <pre className='border border-primary rounded-md p-4 overflow-auto max-h-60'>
          <h3 className='text-primary font-semibold mb-2'>Current Values</h3>
          {JSON.stringify(form.getValues(), null, 2)}
        </pre>

        <pre className='border border-orange-500 rounded-md p-4 overflow-auto max-h-60'>
          <h3 className='text-orange-600 font-semibold mb-2'>Changed Fields</h3>
          {changedFields ? JSON.stringify(changedFields, null, 2) : 'No changes yet'}
        </pre>
      </div>
    </div>
  );
}
