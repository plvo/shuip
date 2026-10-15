import { useLens } from '@hookform/lenses';
import { createFormHook } from '@tanstack/react-form';
import type { ComponentType } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

export interface Option {
  value: string;
  label: string;
}

export interface HarnessProps {
  multiple?: boolean;
  options?: Option[];
  onSearch?: (query: string) => Promise<Option[]>;
}

export type ComboboxFieldComponent = ComponentType<Record<string, unknown>>;

export function reactHookFormHarness(ComboboxField: ComboboxFieldComponent): ComponentType<HarnessProps> {
  return function Harness({ multiple, options, onSearch }) {
    const form = useForm<{ countries: string | string[] }>({ defaultValues: { countries: multiple ? [] : '' } });
    const lens = useLens({ control: form.control }).focus('countries');

    return (
      <FormProvider {...form}>
        <ComboboxField lens={lens} multiple={multiple} label='Country' options={options} onSearch={onSearch} />
      </FormProvider>
    );
  };
}

export function tanstackFormHarness(
  ComboboxField: ComboboxFieldComponent,
  contexts: { fieldContext: unknown; formContext: unknown },
): ComponentType<HarnessProps> {
  const { useAppForm } = createFormHook({
    ...(contexts as { fieldContext: never; formContext: never }),
    fieldComponents: { ComboboxField },
    formComponents: {},
  });

  return function Harness({ multiple, options, onSearch }) {
    const form = useAppForm({ defaultValues: { countries: multiple ? ([] as string[]) : '' } });

    return (
      <form.AppField name='countries'>
        {(field) => <field.ComboboxField multiple={multiple} label='Country' options={options} onSearch={onSearch} />}
      </form.AppField>
    );
  };
}
