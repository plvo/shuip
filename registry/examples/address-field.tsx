'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { AddressField, addressSchema } from '@/components/ui/shuip/address-field';
import { InputField } from '@/components/ui/shuip/input-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  name: z.string(),
  address: addressSchema,
});

export default function AddressFieldExample() {
  const form = useForm({
    defaultValues: {
      name: 'John Doe',
      address: {
        street: '',
        city: '',
        postalCode: '',
        country: '',
        fullAddress: '',
        placeId: '',
      },
    },
    resolver: zodResolver(zodSchema),
  });

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(`Values: ${JSON.stringify(values, null, 2)}`);
      form.reset();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 w-full'>
        <InputField register={form.register('name')} label='Name' placeholder='Enter your name' />
        <AddressField register={form.register('address')} placeholder='Enter your address' className='w-full' />
        <SubmitButton>Check</SubmitButton>

        <pre className='border border-primary rounded-md p-4 overflow-x-auto'>
          <h3 className='text-primary'>Form values</h3>
          <pre>{JSON.stringify(form.watch(), null, 2)}</pre>
        </pre>
      </form>
    </Form>
  );
}
