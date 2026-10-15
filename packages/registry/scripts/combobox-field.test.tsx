import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import type { ComponentType } from 'react';
import type { Root } from 'react-dom/client';
import type { HarnessProps, Option } from './combobox-field-harness';
import { installDom, resolveCanonicalAliases } from './dom-environment';

const COUNTRIES: Option[] = [
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'es', label: 'Spain' },
];

const VARIANTS = [
  'react-hook-form on Radix',
  'react-hook-form on Base UI',
  'tanstack-form on Radix',
  'tanstack-form on Base UI',
] as const;

type Variant = (typeof VARIANTS)[number];

const harnesses = {} as Record<Variant, ComponentType<HarnessProps>>;
const roots: Root[] = [];
let uninstallDom: () => Promise<void>;
let act: typeof import('react').act;
let createElement: typeof import('react').createElement;
let createRoot: typeof import('react-dom/client').createRoot;

// The browser and the components are loaded here, not at the top of the file, so that no other test file sees them.
beforeAll(async () => {
  uninstallDom = installDom();
  resolveCanonicalAliases(/combobox-field\/component\.radix\.tsx$/);
  ({ act, createElement } = await import('react'));
  ({ createRoot } = await import('react-dom/client'));
  const { reactHookFormHarness, tanstackFormHarness } = await import('./combobox-field-harness');

  const rhfRadix = await import('../items/react-hook-form/combobox-field/component.radix');
  const rhfBase = await import('../generated/base/items/react-hook-form/combobox-field/component.base');
  const tsfRadix = await import('../items/tanstack-form/combobox-field/component.radix');
  const tsfBase = await import('../generated/base/items/tanstack-form/combobox-field/component.base');
  const radixContexts = await import('../items/tanstack-form/form-context/component.radix');
  const baseContexts = await import('../generated/base/items/tanstack-form/form-context/component.base');

  harnesses['react-hook-form on Radix'] = reactHookFormHarness(rhfRadix.ComboboxField);
  harnesses['react-hook-form on Base UI'] = reactHookFormHarness(rhfBase.ComboboxField);
  harnesses['tanstack-form on Radix'] = tanstackFormHarness(tsfRadix.ComboboxField, radixContexts);
  harnesses['tanstack-form on Base UI'] = tanstackFormHarness(tsfBase.ComboboxField, baseContexts);
});

afterAll(async () => {
  await uninstallDom();
});

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
});

const settle = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

async function mount(Harness: ComponentType<HarnessProps>, props: HarnessProps = {}) {
  const card = document.createElement('div');
  card.style.overflowX = 'auto';
  document.body.append(card);
  const root = createRoot(card);
  roots.push(root);
  await act(async () => {
    root.render(createElement(Harness, props));
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

async function blur(input: HTMLInputElement) {
  await act(async () => {
    input.blur();
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

async function pressMouse(element: HTMLElement) {
  const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
  await act(async () => {
    element.dispatchEvent(mousedown);
    await settle();
  });
  return mousedown;
}

async function click(element: HTMLElement) {
  await pressMouse(element);
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await settle();
  });
}

describe.each(VARIANTS)('ComboboxField, %s', (variant) => {
  const mountField = (props: HarnessProps = {}) => mount(harnesses[variant], props);

  test('opens its list outside a scrolling card so the card never clips it', async () => {
    const { card, input } = await mountField({ options: COUNTRIES });
    await focus(input);
    expect(isOpen()).toBe(true);
    expect(card.contains(listbox())).toBe(false);
  });

  test('exposes the listbox to assistive technology, not an unnamed dialog around it', async () => {
    const { input } = await mountField({ options: COUNTRIES });
    await focus(input);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(listbox()).not.toBeNull();
  });

  test('lists every option on focus and filters them as the user types', async () => {
    const { input } = await mountField({ options: COUNTRIES });
    await focus(input);
    expect(optionLabels()).toEqual(['France', 'Germany', 'Spain']);
    await type(input, 'ger');
    expect(optionLabels()).toEqual(['Germany']);
  });

  test('selects an option by click and shows its label in the input', async () => {
    const { input } = await mountField({ options: COUNTRIES });
    await focus(input);
    await click(optionNamed('Spain'));
    expect(isOpen()).toBe(false);
    expect(input.value).toBe('Spain');
  });

  test('pressing an option does not take focus from the input, which would close the list before the click', async () => {
    const { input } = await mountField({ options: COUNTRIES });
    await focus(input);
    const mousedown = await pressMouse(optionNamed('Spain'));
    expect(mousedown.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(isOpen()).toBe(true);
  });

  test('selects the highlighted option with the keyboard', async () => {
    const { input } = await mountField({ options: COUNTRIES });
    await focus(input);
    await press(input, 'ArrowDown');
    await press(input, 'Enter');
    expect(input.value).toBe('Germany');
  });

  test('keeps focus in the input while the list is open', async () => {
    const { input } = await mountField({ options: COUNTRIES });
    await focus(input);
    expect(isOpen()).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  test('closes the list on Escape', async () => {
    const { input } = await mountField({ options: COUNTRIES });
    await focus(input);
    await press(input, 'Escape');
    expect(isOpen()).toBe(false);
  });

  test('closes the list when the input loses focus, as an outside click makes it', async () => {
    const { input } = await mountField({ options: COUNTRIES });
    await focus(input);
    await blur(input);
    expect(isOpen()).toBe(false);
  });

  test('in multiple mode keeps the list open and shows each pick as a removable chip', async () => {
    const { card, input } = await mountField({ multiple: true, options: COUNTRIES });
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
    const { input } = await mountField({ onSearch });
    await focus(input);
    expect(listbox()?.textContent?.includes('Searching')).toBe(true);
    await act(async () => {
      finishSearch(COUNTRIES);
      await settle();
    });
    expect(optionLabels()).toEqual(['France', 'Germany', 'Spain']);
  });
});
