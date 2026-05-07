'use client';

import { useForm } from '@tanstack/react-form';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfInputFieldNestedPathExample() {
  const form = useForm({
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
        <InputField
          form={form}
          name='user.email'
          label='Email Address'
          props={{ type: 'email' }}
          formProps={{
            validators: {
              onChange: ({ value }) => {
                if (!value) return 'Email is required';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
                return undefined;
              },
            },
          }}
        />
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Profile</h3>
        <div className='grid grid-cols-2 gap-4'>
          <InputField
            form={form}
            name='user.profile.firstName'
            label='First Name'
            formProps={{
              validators: {
                onChange: ({ value }) => (!value ? 'First name is required' : undefined),
              },
            }}
          />
          <InputField
            form={form}
            name='user.profile.lastName'
            label='Last Name'
            formProps={{
              validators: {
                onChange: ({ value }) => (!value ? 'Last name is required' : undefined),
              },
            }}
          />
        </div>
        <InputField
          form={form}
          name='user.profile.bio'
          label='Bio'
          description='Tell us about yourself'
          props={{ placeholder: 'Software developer from...' }}
        />
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Address</h3>
        <InputField
          form={form}
          name='user.address.street'
          label='Street Address'
          formProps={{
            validators: {
              onChange: ({ value }) => (!value ? 'Street address is required' : undefined),
            },
          }}
        />
        <div className='grid grid-cols-2 gap-4'>
          <InputField form={form} name='user.address.city' label='City' />
          <InputField
            form={form}
            name='user.address.zipCode'
            label='ZIP Code'
            props={{ placeholder: '12345' }}
            formProps={{
              validators: {
                onChange: ({ value }) => {
                  if (!value) return undefined;
                  if (!/^\d{5}(-\d{4})?$/.test(value)) return 'Invalid ZIP code format';
                  return undefined;
                },
              },
            }}
          />
        </div>
      </div>

      <SubmitButton form={form}>Save Profile</SubmitButton>
    </form>
  );
}
