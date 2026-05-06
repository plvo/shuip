'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { AddressField, addressSchema } from '@/components/ui/shuip/react-hook-form/address-field';
import { CheckboxField } from '@/components/ui/shuip/react-hook-form/checkbox-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  billingAddress: addressSchema,
  sameAsShipping: z.boolean(),
  shippingAddress: addressSchema.optional(),
});

export default function RhfAddressFieldShippingBillingExample() {
  const form = useForm({
    defaultValues: {
      billingAddress: {
        street: '',
        city: '',
        postalCode: '',
        country: '',
        fullAddress: '',
        placeId: '',
      },
      sameAsShipping: false,
      shippingAddress: {
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

  const sameAsShipping = form.watch('sameAsShipping');

  async function onSubmit(values: z.infer<typeof zodSchema>) {
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
            register={form.register('billingAddress')}
            label='Billing Address'
            placeholder='Enter billing address'
            description='Address for payment processing'
          />
        </div>

        <CheckboxField
          register={form.register('sameAsShipping')}
          label='Shipping address is the same as billing address'
        />

        {!sameAsShipping && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Shipping Address</h3>
            <AddressField
              register={form.register('shippingAddress')}
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
