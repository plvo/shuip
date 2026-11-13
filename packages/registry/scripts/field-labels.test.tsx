import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import type { ComponentType } from 'react';
import { installDom, resolveCanonicalAliases } from './dom-environment';
import type { LabelledFields } from './field-label-harness';
import { labelledControl } from './labelled-control';
import { createReactMount } from './react-mount';

const VARIANTS = [
  'react-hook-form on Radix',
  'react-hook-form on Base UI',
  'tanstack-form on Radix',
  'tanstack-form on Base UI',
] as const;

type Variant = (typeof VARIANTS)[number];

const fields = {} as Record<Variant, LabelledFields>;
const reactMount = createReactMount();
let act: typeof import('react').act;
let createElement: typeof import('react').createElement;
let uninstallDom: () => Promise<void>;

// The browser and the components are loaded here, not at the top of the file, so that no other test file sees them.
beforeAll(async () => {
  uninstallDom = installDom();
  resolveCanonicalAliases(/(select-field|radio-field|time-range|inline-edit)\/component\.radix\.tsx$/);
  ({ act, createElement } = await reactMount.load());
  const { reactHookFormFields, tanstackFormFields } = await import('./field-label-harness');

  fields['react-hook-form on Radix'] = reactHookFormFields({
    RadioField: (await import('../items/react-hook-form/radio-field/component.radix')).RadioField,
    TimeRangeField: (await import('../items/react-hook-form/time-range/component.radix')).TimeRangeField,
    InlineEditField: (await import('../items/react-hook-form/inline-edit/component.radix')).InlineEditField,
  });
  fields['react-hook-form on Base UI'] = reactHookFormFields({
    RadioField: (await import('../generated/base/items/react-hook-form/radio-field/component.base')).RadioField,
    TimeRangeField: (await import('../generated/base/items/react-hook-form/time-range/component.base')).TimeRangeField,
    InlineEditField: (await import('../generated/base/items/react-hook-form/inline-edit/component.base'))
      .InlineEditField,
  });
  fields['tanstack-form on Radix'] = tanstackFormFields({
    contexts: await import('../items/tanstack-form/form-context/component.radix'),
    SelectField: (await import('../items/tanstack-form/select-field/component.radix')).SelectField,
    RadioField: (await import('../items/tanstack-form/radio-field/component.radix')).RadioField,
    TimeRangeField: (await import('../items/tanstack-form/time-range/component.radix')).TimeRangeField,
    InlineEditField: (await import('../items/tanstack-form/inline-edit/component.radix')).InlineEditField,
  });
  fields['tanstack-form on Base UI'] = tanstackFormFields({
    contexts: await import('../generated/base/items/tanstack-form/form-context/component.base'),
    SelectField: (await import('../generated/base/items/tanstack-form/select-field/component.base')).SelectField,
    RadioField: (await import('../generated/base/items/tanstack-form/radio-field/component.base')).RadioField,
    TimeRangeField: (await import('../generated/base/items/tanstack-form/time-range/component.base')).TimeRangeField,
    InlineEditField: (await import('../generated/base/items/tanstack-form/inline-edit/component.base')).InlineEditField,
  });
});

afterAll(async () => {
  await uninstallDom();
});

afterEach(reactMount.cleanup);

async function show(Field: ComponentType) {
  const { errors, render } = reactMount.mount();
  await render(createElement(Field));
  return { card: document.body, errors };
}

async function click(element: Element | null) {
  await act(async () => {
    (element as HTMLElement).click();
  });
}

describe.each(VARIANTS)('%s', (variant) => {
  test('the radio field names its radio group by its label', async () => {
    const { card, errors } = await show(fields[variant].RadioField);
    expect(labelledControl(card, 'Plan')).toBe(card.querySelector('[role="radiogroup"]') as Element);
    expect(errors).toEqual([]);
  });

  test('the time range names the group of its start and end times by its label', async () => {
    const { card, errors } = await show(fields[variant].TimeRangeField);
    const group = labelledControl(card, 'Opening hours');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.contains(labelledControl(card, 'Start'))).toBe(true);
    expect(group.contains(labelledControl(card, 'End'))).toBe(true);
    expect(errors).toEqual([]);
  });

  test('the inline edit binds its label to the input it opens', async () => {
    const { card, errors } = await show(fields[variant].InlineEditField);
    await click(card.querySelector('[data-slot="inline-edit"]'));
    expect(labelledControl(card, 'Title')).toBe(card.querySelector('input') as Element);
    expect(errors).toEqual([]);
  });
});

describe.each(['tanstack-form on Radix', 'tanstack-form on Base UI'] as const)('%s', (variant) => {
  test('the select field binds its label to its trigger', async () => {
    const { card, errors } = await show(fields[variant].SelectField as ComponentType);
    expect(labelledControl(card, 'Fruit')).toBe(card.querySelector('[data-slot="select-trigger"]') as Element);
    expect(errors).toEqual([]);
  });
});
