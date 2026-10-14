'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { SelectField } from '@/components/ui/shuip/react-hook-form/select-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z.object({
  accountType: z.enum(['personal', 'business']),
  businessName: z.string(),
  companySize: z.string(),
});

type FormValues = { accountType: string; businessName: string; companySize: string };
type SubmitValues = z.infer<typeof zodSchema>;

export default function RhfSelectFieldConditionalExample() {
  const form = useForm<FormValues, unknown, SubmitValues>({
    defaultValues: {
      accountType: '',
      businessName: '',
      companySize: '',
    },
    resolver: zodResolver<FormValues, unknown, SubmitValues>(zodSchema),
  });
  const lens = useLens({ control: form.control });

  const accountType = form.watch('accountType');

  async function onSubmit(values: SubmitValues) {
    try {
      alert(JSON.stringify(values, null, 2));
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <SelectField
          lens={lens.focus('accountType')}
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
              lens={lens.focus('businessName')}
              label='Business Name'
              placeholder='Enter your business name'
              description='Legal name of your business'
            />

            <SelectField
              lens={lens.focus('companySize')}
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
    </FormProvider>
  );
}
