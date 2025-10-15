'use client';

import { useForm } from '@tanstack/react-form';
import React from 'react';
import { SelectField } from '@/components/ui/shuip/tanstack-form/select-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

// Simulate API call
async function fetchCategories(): Promise<Record<string, string>> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    Technology: 'tech',
    Design: 'design',
    Marketing: 'marketing',
    Finance: 'finance',
    Health: 'health',
  };
}

export default function TsfSelectFieldDynamicExample() {
  const [categories, setCategories] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  const form = useForm({
    defaultValues: {
      category: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  React.useEffect(() => {
    fetchCategories()
      .then((data) => {
        setCategories(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div className='text-muted-foreground'>Loading categories...</div>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <SelectField
        form={form}
        name='category'
        options={categories}
        label='Category'
        placeholder='Select a category'
        description='Categories loaded from API'
        formProps={{
          validators: {
            onChange: ({ value }) => (!value ? 'Please select a category' : undefined),
          },
        }}
      />

      <SubmitButton form={form}>Submit</SubmitButton>
    </form>
  );
}
