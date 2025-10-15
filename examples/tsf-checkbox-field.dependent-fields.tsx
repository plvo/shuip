'use client';

import { useForm, useStore } from '@tanstack/react-form';
import { CheckboxField } from '#/registry/ui/tsf-checkbox-field';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfCheckboxFieldDependentFieldsExample() {
  const form = useForm({
    defaultValues: {
      customShipping: false,
      shippingAddress: '',
      sameAsBilling: false,
      billingAddress: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  const customShipping = useStore(form.store, (state) => state.values.customShipping);
  const sameAsBilling = useStore(form.store, (state) => state.values.sameAsBilling);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <InputField
        form={form}
        name='billingAddress'
        label='Billing Address'
        formProps={{
          validators: {
            onChange: ({ value }) => (!value ? 'Billing address is required' : undefined),
          },
        }}
      />

      <CheckboxField
        form={form}
        name='customShipping'
        label='Use a different shipping address'
        formProps={{
          listeners: {
            onChange: ({ value }) => {
              if (!value) {
                form.setFieldValue('shippingAddress', '');
                form.setFieldValue('sameAsBilling', false);
              }
            },
          },
        }}
      />

      {customShipping && (
        <div className='space-y-4 pl-6 border-l-2'>
          <CheckboxField
            form={form}
            name='sameAsBilling'
            label='Same as billing address'
            formProps={{
              listeners: {
                onChange: ({ value }) => {
                  if (!value) {
                    form.setFieldValue('shippingAddress', '');
                  } else {
                    form.setFieldValue('shippingAddress', form.getFieldValue('billingAddress'));
                  }
                },
              },
            }}
          />

          <InputField
            form={form}
            name='shippingAddress'
            label='Shipping Address'
            props={{ disabled: sameAsBilling }}
            formProps={{
              validators: {
                onChange: ({ value }) => {
                  if (!value && customShipping) return 'Shipping address is required';
                  return undefined;
                },
              },
            }}
          />
        </div>
      )}

      <SubmitButton form={form}>Submit Order</SubmitButton>
    </form>
  );
}
