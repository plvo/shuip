'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField },
  formComponents: { SubmitButton },
});

export default function TsfInputFieldNestedPathExample() {
  const form = useAppForm({
    defaultValues: {
      user: {
        email: '',
        profile: {
          firstName: '',
          lastName: '',
          bio: '',
        },
        address: {
          street: '',
          city: '',
          zipCode: '',
        },
      },
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-6'
    >
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Account</h3>
        <form.AppField
          name='user.email'
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Email is required';
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
              return undefined;
            },
          }}
          children={(field) => <field.InputField label='Email Address' props={{ type: 'email' }} />}
        />
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Profile</h3>
        <div className='grid grid-cols-2 gap-4'>
          <form.AppField
            name='user.profile.firstName'
            validators={{
              onChange: ({ value }) => (!value ? 'First name is required' : undefined),
            }}
            children={(field) => <field.InputField label='First Name' />}
          />
          <form.AppField
            name='user.profile.lastName'
            validators={{
              onChange: ({ value }) => (!value ? 'Last name is required' : undefined),
            }}
            children={(field) => <field.InputField label='Last Name' />}
          />
        </div>
        <form.AppField
          name='user.profile.bio'
          children={(field) => (
            <field.InputField
              label='Bio'
              description='Tell us about yourself'
              props={{ placeholder: 'Software developer from...' }}
            />
          )}
        />
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Address</h3>
        <form.AppField
          name='user.address.street'
          validators={{
            onChange: ({ value }) => (!value ? 'Street address is required' : undefined),
          }}
          children={(field) => <field.InputField label='Street Address' />}
        />
        <div className='grid grid-cols-2 gap-4'>
          <form.AppField name='user.address.city' children={(field) => <field.InputField label='City' />} />
          <form.AppField
            name='user.address.zipCode'
            validators={{
              onChange: ({ value }) => {
                if (!value) return undefined;
                if (!/^\d{5}(-\d{4})?$/.test(value)) return 'Invalid ZIP code format';
                return undefined;
              },
            }}
            children={(field) => <field.InputField label='ZIP Code' props={{ placeholder: '12345' }} />}
          />
        </div>
      </div>

      <form.AppForm>
        <form.SubmitButton>Save Profile</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
