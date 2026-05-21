'use client';

import { createFormHook, useStore } from '@tanstack/react-form';
import { CheckboxField } from '@/components/ui/shuip/tanstack-form/checkbox-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { CheckboxField, InputField },
  formComponents: { SubmitButton },
});

export default function TsfCheckboxFieldDependentFieldsExample() {
  const form = useAppForm({
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
      <form.AppField
        name='billingAddress'
        validators={{
          onChange: ({ value }) => (!value ? 'Billing address is required' : undefined),
        }}
        children={(field) => <field.InputField label='Billing Address' />}
      />

      <form.AppField
        name='customShipping'
        listeners={{
          onChange: ({ value }) => {
            if (!value) {
              form.setFieldValue('shippingAddress', '');
              form.setFieldValue('sameAsBilling', false);
            }
          },
        }}
        children={(field) => <field.CheckboxField label='Use a different shipping address' />}
      />

      {customShipping && (
        <div className='space-y-4 pl-6 border-l-2'>
          <form.AppField
            name='sameAsBilling'
            listeners={{
              onChange: ({ value }) => {
                if (!value) {
                  form.setFieldValue('shippingAddress', '');
                } else {
                  form.setFieldValue('shippingAddress', form.getFieldValue('billingAddress'));
                }
              },
            }}
            children={(field) => <field.CheckboxField label='Same as billing address' />}
          />

          <form.AppField
            name='shippingAddress'
            validators={{
              onChange: ({ value }) => {
                if (!value && customShipping) return 'Shipping address is required';
                return undefined;
              },
            }}
            children={(field) => <field.InputField label='Shipping Address' props={{ disabled: sameAsBilling }} />}
          />
        </div>
      )}

      <form.AppForm>
        <form.SubmitButton>Submit Order</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
