'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { SelectField } from '@/components/ui/shuip/react-hook-form/select-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  accountType: z.enum(['personal', 'business']),
  businessName: z.string().optional(),
  companySize: z.string().optional(),
});

export default function RhfSelectFieldConditionalExample() {
  const form = useForm({
    defaultValues: {
      accountType: undefined,
      businessName: '',
      companySize: '',
    },
    resolver: zodResolver(zodSchema),
  });

  const accountType = form.watch('accountType');

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(JSON.stringify(values, null, 2));
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <SelectField
          register={form.register('accountType')}
          options={{
            Personal: 'personal',
            Business: 'business',
          }}
          label='Account Type'
          placeholder='Select account type'
          description='Choose the type of account you want to create'
        />

        {/* Show business fields only when Business is selected */}
        {accountType === 'business' && (
          <>
            <InputField
              register={form.register('businessName')}
              label='Business Name'
              placeholder='Enter your business name'
              description='Legal name of your business'
            />

            <SelectField
              register={form.register('companySize')}
              options={{
                '1-10 employees': '1-10',
                '11-50 employees': '11-50',
                '51-200 employees': '51-200',
                '201-1000 employees': '201-1000',
                '1000+ employees': '1000+',
              }}
              label='Company Size'
              placeholder='Select company size'
              description='Number of employees in your company'
            />
          </>
        )}

        <SubmitButton>Create Account</SubmitButton>
      </form>
    </Form>
  );
}
