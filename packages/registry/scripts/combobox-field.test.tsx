import { afterEach, describe, expect, test } from 'bun:test';
import { act, type ComponentType, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ComboboxField as ReactHookFormBase } from '../generated/base/items/react-hook-form/combobox-field/component.base';
import { ComboboxField as TanstackFormBase } from '../generated/base/items/tanstack-form/combobox-field/component.base';
import {
  fieldContext as tanstackFieldContextBase,
  formContext as tanstackFormContextBase,
} from '../generated/base/items/tanstack-form/form-context/component.base';
import { ComboboxField as ReactHookFormRadix } from '../items/react-hook-form/combobox-field/component.radix';
import { ComboboxField as TanstackFormRadix } from '../items/tanstack-form/combobox-field/component.radix';
import { fieldContext, formContext } from '../items/tanstack-form/form-context/component.radix';
import {
  type ComboboxFieldComponent,
  type HarnessProps,
  type Option,
  reactHookFormHarness,
  tanstackFormHarness,
} from './combobox-field-harness';

const COUNTRIES: Option[] = [
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'es', label: 'Spain' },
];

const variants: [string, ComponentType<HarnessProps>][] = [
  ['react-hook-form on Radix', reactHookFormHarness(ReactHookFormRadix as unknown as ComboboxFieldComponent)],
  ['react-hook-form on Base UI', reactHookFormHarness(ReactHookFormBase as unknown as ComboboxFieldComponent)],
  [
    'tanstack-form on Radix',
    tanstackFormHarness(TanstackFormRadix as unknown as ComboboxFieldComponent, { fieldContext, formContext }),
  ],
  [
    'tanstack-form on Base UI',
    tanstackFormHarness(TanstackFormBase as unknown as ComboboxFieldComponent, {
      fieldContext: tanstackFieldContextBase,
      formContext: tanstackFormContextBase,
    }),
  ],
];

const settle = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

afterEach(() => {
  document.body.innerHTML = '';
});

async function mount(Harness: ComponentType<HarnessProps>, props: HarnessProps = {}) {
  const card = document.createElement('div');
  card.style.overflowX = 'auto';
  document.body.append(card);
  await act(async () => {
    createRoot(card).render(createElement(Harness, props));
  });
  const input = card.querySelector('input') as HTMLInputElement;
  return { card, input };
}

const listbox = () => document.querySelector('[role="listbox"]');
const isOpen = () => listbox() !== null;
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];
const optionLabels = () => options().map((option) => option.textContent);
const optionNamed = (label: string) => options().find((option) => option.textContent?.includes(label)) as HTMLElement;
const chipLabels = (card: HTMLElement) =>
  [...card.querySelectorAll('button[aria-label^="Remove"]')].map((button) => button.getAttribute('aria-label'));

async function focus(input: HTMLInputElement) {
  await act(async () => {
    input.focus();
    await settle();
  });
}

async function type(input: HTMLInputElement, text: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
  });
}

async function press(input: HTMLInputElement, key: string) {
  await act(async () => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await settle();
  });
}

async function click(element: HTMLElement) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await settle();
  });
}

describe.each(variants)('ComboboxField, %s', (_, Harness) => {
  test('opens its list outside a scrolling card so the card never clips it', async () => {
    const { card, input } = await mount(Harness, { options: COUNTRIES });
    await focus(input);
    expect(isOpen()).toBe(true);
    expect(card.contains(listbox())).toBe(false);
  });

  test('lists every option on focus and filters them as the user types', async () => {
    const { input } = await mount(Harness, { options: COUNTRIES });
    await focus(input);
    expect(optionLabels()).toEqual(['France', 'Germany', 'Spain']);
    await type(input, 'ger');
    expect(optionLabels()).toEqual(['Germany']);
  });

  test('selects an option by click and shows its label in the input', async () => {
    const { input } = await mount(Harness, { options: COUNTRIES });
    await focus(input);
    await click(optionNamed('Spain'));
    expect(isOpen()).toBe(false);
    expect(input.value).toBe('Spain');
  });

  test('selects the highlighted option with the keyboard', async () => {
    const { input } = await mount(Harness, { options: COUNTRIES });
    await focus(input);
    await press(input, 'ArrowDown');
    await press(input, 'Enter');
    expect(input.value).toBe('Germany');
  });

  test('keeps focus in the input while the list is open', async () => {
    const { input } = await mount(Harness, { options: COUNTRIES });
    await focus(input);
    expect(isOpen()).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  test('closes the list on Escape', async () => {
    const { input } = await mount(Harness, { options: COUNTRIES });
    await focus(input);
    await press(input, 'Escape');
    expect(isOpen()).toBe(false);
  });

  test('in multiple mode keeps the list open and shows each pick as a removable chip', async () => {
    const { card, input } = await mount(Harness, { multiple: true, options: COUNTRIES });
    await focus(input);
    await click(optionNamed('France'));
    await click(optionNamed('Spain'));
    expect(isOpen()).toBe(true);
    expect(chipLabels(card)).toEqual(['Remove France', 'Remove Spain']);
    await click(card.querySelector('button[aria-label="Remove France"]') as HTMLElement);
    expect(chipLabels(card)).toEqual(['Remove Spain']);
  });

  test('says it is searching, then lists what an async search returns', async () => {
    let finishSearch: (found: Option[]) => void = () => {};
    const onSearch = () => new Promise<Option[]>((resolve) => (finishSearch = resolve));
    const { input } = await mount(Harness, { onSearch });
    await focus(input);
    expect(listbox()?.textContent?.includes('Searching')).toBe(true);
    await act(async () => {
      finishSearch(COUNTRIES);
      await settle();
    });
    expect(optionLabels()).toEqual(['France', 'Germany', 'Spain']);
  });
});
