'use client';

import { useForm } from '@tanstack/react-form';
import React from 'react';
import { SelectField } from '@/components/ui/shuip/tanstack-form/select-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const COUNTRIES = {
  'United States': 'us',
  Canada: 'ca',
  Mexico: 'mx',
};

const STATES_BY_COUNTRY: Record<string, Record<string, string>> = {
  us: {
    California: 'ca',
    Texas: 'tx',
    'New York': 'ny',
    Florida: 'fl',
  },
  ca: {
    Ontario: 'on',
    Quebec: 'qc',
    'British Columbia': 'bc',
    Alberta: 'ab',
  },
  mx: {
    'Mexico City': 'cdmx',
    Jalisco: 'jal',
    'Nuevo León': 'nl',
  },
};

export default function TsfSelectFieldDependentExample() {
  const [stateOptions, setStateOptions] = React.useState<Record<string, string>>({});

  const form = useForm({
    defaultValues: {
      country: '',
      state: '',
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
      className='space-y-4'
    >
      <SelectField
        form={form}
        name='country'
        options={COUNTRIES}
        label='Country'
        placeholder='Select a country'
        formProps={{
          validators: {
            onChange: ({ value }) => (!value ? 'Please select a country' : undefined),
          },
          listeners: {
            onChange: ({ value }) => {
              if (value && STATES_BY_COUNTRY[value]) {
                setStateOptions(STATES_BY_COUNTRY[value]);
              } else {
                setStateOptions({});
              }
              // Reset state field when country changes
              form.setFieldValue('state', '');
            },
          },
        }}
      />

      <SelectField
        form={form}
        name='state'
        options={stateOptions}
        label='State / Province'
        placeholder={Object.keys(stateOptions).length === 0 ? 'Select a country first' : 'Select a state'}
        formProps={{
          validators: {
            onChange: ({ value }) => (!value ? 'Please select a state' : undefined),
          },
        }}
      />

      <SubmitButton form={form}>Submit</SubmitButton>
    </form>
  );
}
