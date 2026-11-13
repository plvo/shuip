import { useLens } from '@hookform/lenses';
import { createFormHook } from '@tanstack/react-form';
import type { ComponentType } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { InlineEditField as ReactHookFormInlineEditField } from '../items/react-hook-form/inline-edit/component.radix';
import type { RadioField as ReactHookFormRadioField } from '../items/react-hook-form/radio-field/component.radix';
import type { TimeRangeField as ReactHookFormTimeRangeField } from '../items/react-hook-form/time-range/component.radix';
import type { fieldContext, formContext } from '../items/tanstack-form/form-context/component.radix';
import type { InlineEditField as TanstackFormInlineEditField } from '../items/tanstack-form/inline-edit/component.radix';
import type { RadioField as TanstackFormRadioField } from '../items/tanstack-form/radio-field/component.radix';
import type { SelectField as TanstackFormSelectField } from '../items/tanstack-form/select-field/component.radix';
import type { TimeRangeField as TanstackFormTimeRangeField } from '../items/tanstack-form/time-range/component.radix';

/** One form per field item, each showing the item with a label: Fruit, Plan, Opening hours or Title. */
export interface LabelledFields {
  SelectField?: ComponentType;
  RadioField: ComponentType;
  TimeRangeField: ComponentType;
  InlineEditField: ComponentType;
}

export interface TanstackFormItems {
  contexts: { fieldContext: typeof fieldContext; formContext: typeof formContext };
  SelectField: typeof TanstackFormSelectField;
  RadioField: typeof TanstackFormRadioField;
  TimeRangeField: typeof TanstackFormTimeRangeField;
  InlineEditField: typeof TanstackFormInlineEditField;
}

export interface ReactHookFormItems {
  RadioField: typeof ReactHookFormRadioField;
  TimeRangeField: typeof ReactHookFormTimeRangeField;
  InlineEditField: typeof ReactHookFormInlineEditField;
}

const DEFAULT_VALUES = { fruit: '', plan: '', hours: { start: '', end: '' }, title: 'Draft' };

export function tanstackFormFields({ contexts, ...fieldComponents }: TanstackFormItems): LabelledFields {
  const { useAppForm } = createFormHook({ ...contexts, fieldComponents, formComponents: {} });

  function SelectField() {
    const form = useAppForm({ defaultValues: DEFAULT_VALUES });
    return (
      <form.AppField name='fruit'>
        {(field) => <field.SelectField label='Fruit' options={{ Apple: 'apple', Pear: 'pear' }} />}
      </form.AppField>
    );
  }

  function RadioField() {
    const form = useAppForm({ defaultValues: DEFAULT_VALUES });
    return (
      <form.AppField name='plan'>
        {(field) => (
          <field.RadioField
            label='Plan'
            options={[
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly', value: 'yearly' },
            ]}
          />
        )}
      </form.AppField>
    );
  }

  function TimeRangeField() {
    const form = useAppForm({ defaultValues: DEFAULT_VALUES });
    return <form.AppField name='hours'>{(field) => <field.TimeRangeField label='Opening hours' />}</form.AppField>;
  }

  function InlineEditField() {
    const form = useAppForm({ defaultValues: DEFAULT_VALUES });
    return <form.AppField name='title'>{(field) => <field.InlineEditField label='Title' />}</form.AppField>;
  }

  return { SelectField, RadioField, TimeRangeField, InlineEditField };
}

export function reactHookFormFields(items: ReactHookFormItems): LabelledFields {
  function RadioField() {
    const form = useForm({ defaultValues: DEFAULT_VALUES });
    const lens = useLens({ control: form.control }).focus('plan');
    return (
      <FormProvider {...form}>
        <items.RadioField lens={lens} label='Plan' options={['monthly', 'yearly']} />
      </FormProvider>
    );
  }

  function TimeRangeField() {
    const form = useForm({ defaultValues: DEFAULT_VALUES });
    const lens = useLens({ control: form.control }).focus('hours');
    return (
      <FormProvider {...form}>
        <items.TimeRangeField lens={lens} label='Opening hours' />
      </FormProvider>
    );
  }

  function InlineEditField() {
    const form = useForm({ defaultValues: DEFAULT_VALUES });
    const lens = useLens({ control: form.control }).focus('title');
    return (
      <FormProvider {...form}>
        <items.InlineEditField lens={lens} label='Title' />
      </FormProvider>
    );
  }

  return { RadioField, TimeRangeField, InlineEditField };
}
