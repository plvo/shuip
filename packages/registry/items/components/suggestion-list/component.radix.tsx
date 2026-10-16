'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/** The classes of the popup that holds the options; merge it into the popup's own classes. */
export const listboxClassName = 'no-scrollbar block max-h-60 scroll-py-1 overflow-x-hidden overflow-y-auto p-2';

const OPTION_CLASS =
  "group/suggestion relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none aria-selected:bg-accent aria-selected:text-accent-foreground aria-selected:**:[svg]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const EMPTY_CLASS = 'py-6 text-center text-sm text-muted-foreground';

export const listboxId = (inputId: string): string => `${inputId}-listbox`;

export const labelId = (inputId: string): string => `${inputId}-label`;

export const optionId = (inputId: string, index: number): string => `${listboxId(inputId)}-option-${index}`;

export interface ActiveOptionState {
  inputId: string;
  open: boolean;
  selectedIndex: number;
  count: number;
}

/** The id of the highlighted option, absent while the list is closed or nothing is highlighted. */
export function activeOptionId({ inputId, open, selectedIndex, count }: ActiveOptionState): string | undefined {
  const hasActiveOption = open && selectedIndex >= 0 && selectedIndex < count;
  return hasActiveOption ? optionId(inputId, selectedIndex) : undefined;
}

export interface ListboxNameSource {
  inputId: string;
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
}

/** The field label names the listbox; without one, the input's own `aria-label`, then its placeholder, do. */
export function listboxName({
  inputId,
  label,
  ariaLabel,
  placeholder,
}: ListboxNameSource): { 'aria-labelledby': string } | { 'aria-label': string | undefined } {
  return label ? { 'aria-labelledby': labelId(inputId) } : { 'aria-label': ariaLabel ?? placeholder };
}

export interface SuggestionListState extends ListboxNameSource, ActiveOptionState {
  busy?: boolean;
}

export type ComboboxInputProps = Pick<
  React.ComponentProps<'input'>,
  'role' | 'aria-autocomplete' | 'aria-expanded' | 'aria-controls' | 'aria-activedescendant'
>;

export type ListboxProps = Pick<React.ComponentProps<'div'>, 'id' | 'role' | 'aria-busy' | 'onMouseDown'> &
  ReturnType<typeof listboxName>;

export interface SuggestionList {
  labelId: string;
  optionId: (index: number) => string;
  inputProps: ComboboxInputProps;
  listboxProps: ListboxProps;
}

/**
 * The ARIA wiring of a text input that opens a list of suggestions: spread `inputProps` on the input and
 * `listboxProps` on the popup that holds the options, and give the field label `labelId`.
 */
export function useSuggestionList(state: SuggestionListState): SuggestionList {
  const { inputId, open, busy } = state;
  const activeId = activeOptionId(state);

  React.useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  return {
    labelId: labelId(inputId),
    optionId: (index) => optionId(inputId, index),
    inputProps: {
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-expanded': open,
      'aria-controls': open ? listboxId(inputId) : undefined,
      'aria-activedescendant': activeId,
    },
    listboxProps: {
      id: listboxId(inputId),
      role: 'listbox',
      ...listboxName(state),
      'aria-busy': busy,
      onMouseDown: (event) => event.preventDefault(),
    },
  };
}

export interface SuggestionOptionProps extends Omit<React.ComponentProps<'div'>, 'onSelect'> {
  highlighted: boolean;
  onSelect: () => void;
  onHighlight: () => void;
}

/** One selectable suggestion. The single highlight is drawn from `aria-selected`. */
export function SuggestionOption({ highlighted, onSelect, onHighlight, className, ...props }: SuggestionOptionProps) {
  return (
    <div
      {...props}
      role='option'
      aria-selected={highlighted}
      tabIndex={-1}
      onClick={onSelect}
      onMouseMove={onHighlight}
      className={cn(OPTION_CLASS, className)}
    />
  );
}

/** The message shown in place of the options, kept an option so the listbox is never left without one. */
export function SuggestionEmpty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      {...props}
      role='option'
      aria-disabled='true'
      aria-selected='false'
      tabIndex={-1}
      className={cn(EMPTY_CLASS, className)}
    />
  );
}
