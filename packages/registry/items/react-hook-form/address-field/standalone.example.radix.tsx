'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { AddressField, addressSchema } from '@/components/ui/shuip/react-hook-form/address-field';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  name: z.string(),
  address: addressSchema,
});

type Values = z.infer<typeof zodSchema>;

export default function AddressFieldExample() {
  const form = useForm<Values>({
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
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
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
        <InputField lens={lens.focus('name')} label='Name' placeholder='Enter your name' />
        <AddressField lens={lens.focus('address')} placeholder='Enter your address' className='w-full' />
        <SubmitButton>Check</SubmitButton>

        <pre className='border border-primary rounded-md p-4 overflow-x-auto'>
          <h3 className='text-primary'>Form values</h3>
          <pre>{JSON.stringify(form.watch(), null, 2)}</pre>
        </pre>
      </form>
    </Form>
  );
}
