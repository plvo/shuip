import { useLens } from '@hookform/lenses';
import { createFormHook } from '@tanstack/react-form';
import type { ComponentType } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { ComboboxField as ReactHookFormComboboxField } from '../items/react-hook-form/combobox-field/component.radix';
import type { ComboboxField as TanstackFormComboboxField } from '../items/tanstack-form/combobox-field/component.radix';
import type { fieldContext, formContext } from '../items/tanstack-form/form-context/component.radix';

export interface Option {
  value: string;
  label: string;
}

export interface HarnessProps {
  multiple?: boolean;
  options?: Option[];
  onSearch?: (query: string) => Promise<Option[]>;
}

export function reactHookFormHarness(ComboboxField: typeof ReactHookFormComboboxField): ComponentType<HarnessProps> {
  function SingleHarness({ options, onSearch }: HarnessProps) {
    const form = useForm<{ country: string }>({ defaultValues: { country: '' } });
    const lens = useLens({ control: form.control }).focus('country');
    return (
      <FormProvider {...form}>
        <ComboboxField lens={lens} label='Country' options={options} onSearch={onSearch} />
      </FormProvider>
    );
  }

  function MultipleHarness({ options, onSearch }: HarnessProps) {
    const form = useForm<{ countries: string[] }>({ defaultValues: { countries: [] } });
    const lens = useLens({ control: form.control }).focus('countries');
    return (
      <FormProvider {...form}>
        <ComboboxField multiple lens={lens} label='Country' options={options} onSearch={onSearch} />
      </FormProvider>
    );
  }

  return (props) => (props.multiple ? <MultipleHarness {...props} /> : <SingleHarness {...props} />);
}

export function tanstackFormHarness(
  ComboboxField: typeof TanstackFormComboboxField,
  contexts: { fieldContext: typeof fieldContext; formContext: typeof formContext },
): ComponentType<HarnessProps> {
  const { useAppForm } = createFormHook({
    ...contexts,
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
