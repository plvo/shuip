'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { AddressField, addressSchema } from '@/components/ui/shuip/react-hook-form/address-field';
import { CheckboxField } from '@/components/ui/shuip/react-hook-form/checkbox-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  billing: addressSchema,
  sameAsShipping: z.boolean(),
  shipping: addressSchema,
});

type Values = z.infer<typeof zodSchema>;

const emptyAddress = {
  street: '',
  city: '',
  postalCode: '',
  country: '',
  fullAddress: '',
  placeId: '',
};

export default function RhfAddressFieldShippingBillingExample() {
  const form = useForm<Values>({
    defaultValues: {
      billing: emptyAddress,
      sameAsShipping: false,
      shipping: emptyAddress,
    },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  const sameAsShipping = form.watch('sameAsShipping');
  const billing = form.watch('billing');

  React.useEffect(() => {
    if (sameAsShipping) {
      form.setValue('shipping', billing, { shouldValidate: true });
    }
  }, [sameAsShipping, billing, form]);

  async function onSubmit(values: Values) {
    try {
      alert(JSON.stringify(values, null, 2));
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 w-full'>
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Billing Address</h3>
          <AddressField
            lens={lens.focus('billing')}
            label='Billing Address'
            placeholder='Enter billing address'
            description='Address for payment processing'
          />
        </div>

        <CheckboxField lens={lens.focus('sameAsShipping')} label='Shipping address is the same as billing address' />

        {!sameAsShipping && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Shipping Address</h3>
            <AddressField
              lens={lens.focus('shipping')}
              label='Shipping Address'
              placeholder='Enter shipping address'
              description='Address where items will be delivered'
            />
          </div>
        )}

        <SubmitButton>Save Addresses</SubmitButton>
      </form>
    </Form>
  );
}
