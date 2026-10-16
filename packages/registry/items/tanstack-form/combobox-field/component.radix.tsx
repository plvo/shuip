'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { Check, Loader2, Search, X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { cn } from '@/lib/utils';

const DEBOUNCE_TIME = 300;

// The popover gives its content role="dialog"; the combobox exposes the listbox inside it instead.
const NO_POPUP_ROLE = { role: undefined };

// cmdk hard-codes aria-expanded and aria-controls on its input and spreads the props it receives before them, and
// leaves aria-activedescendant on an option that is gone once the list closes. The input would then report an open
// list and point to elements that do not exist, so they are corrected on the element, and aria-activedescendant is
// removed whenever cmdk writes it while the list is closed (see plvo/shuip#151).
function useListStateOnInput(inputRef: React.RefObject<HTMLInputElement | null>, open: boolean) {
  const listId = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    listId.current = input.getAttribute('aria-controls') ?? listId.current;
    input.setAttribute('aria-expanded', String(open));
    if (open && listId.current) input.setAttribute('aria-controls', listId.current);
    else input.removeAttribute('aria-controls');
    if (open) return;
    const removeActiveDescendant = () => input.removeAttribute('aria-activedescendant');
    removeActiveDescendant();
    const observer = new MutationObserver(removeActiveDescendant);
    observer.observe(input, { attributes: true, attributeFilter: ['aria-activedescendant'] });
    return () => observer.disconnect();
  }, [inputRef, open]);
}

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

type ComboboxFieldVariant = 'boxed' | 'ghost';
type ComboboxFieldSize = 'sm' | 'default';

export interface ComboboxFieldProps {
  multiple?: boolean;
  options?: ComboboxOption[];
  onSearch?: (query: string) => Promise<ComboboxOption[]>;
  maxResults?: number;
  variant?: ComboboxFieldVariant;
  size?: ComboboxFieldSize;
  label?: string;
  description?: string;
  placeholder?: string;
  emptyText?: string;
  debounceMs?: number;
  defaultSelected?: ComboboxOption | ComboboxOption[];
}

const shellVariants: Record<ComboboxFieldVariant, string> = {
  boxed:
    'rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20',
  ghost: 'rounded-md border border-transparent bg-transparent',
};

const shellSizes: Record<ComboboxFieldSize, string> = {
  default: 'min-h-9 gap-1.5 px-2 py-1 text-sm',
  sm: 'min-h-7 gap-1 px-1.5 py-0.5 text-xs',
};

function toArray(value: string | string[] | undefined | null): string[] {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
}

export function ComboboxField({
  multiple = false,
  options,
  onSearch,
  maxResults,
  variant = 'boxed',
  size = 'default',
  label,
  description,
  placeholder,
  emptyText = 'No results',
  debounceMs = DEBOUNCE_TIME,
  defaultSelected,
}: ComboboxFieldProps) {
  // The consumer's field type (string vs string[]) decides single vs multi; the context is
  // widened to the shared shape and values are normalised through `toArray`.
  const field = useFieldContext<string | string[]>();
  const { isValid, errors } = field.state.meta;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [typed, setTyped] = React.useState(false);
  const [results, setResults] = React.useState<ComboboxOption[]>([]);
  const [isPending, startTransition] = React.useTransition();
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = React.useRef(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  useListStateOnInput(inputRef, open);

  // Static options + presets, resolved during render so a value shows its label on first
  // paint; async results and manual picks live in `cacheRef`. `getOption` reads both.
  const cacheRef = React.useRef<Map<string, ComboboxOption> | null>(null);
  cacheRef.current ??= new Map();
  const staticLookup = React.useMemo(() => {
    const map = new Map<string, ComboboxOption>();
    const seed = Array.isArray(defaultSelected) ? defaultSelected : defaultSelected ? [defaultSelected] : [];
    for (const option of [...seed, ...(options ?? [])]) map.set(option.value, option);
    return map;
  }, [defaultSelected, options]);
  const getOption = React.useCallback(
    (value: string | undefined) => (value ? (staticLookup.get(value) ?? cacheRef.current?.get(value)) : undefined),
    [staticLookup],
  );

  const selectedValues = toArray(field.state.value);

  // A pre-filled-but-untouched single label counts as an empty query, so the full list
  // (or `onSearch('')` recents) shows on focus instead of filtering down to the label.
  const effectiveQuery = typed ? query : '';

  // Held in a ref so an inline `onSearch` prop doesn't re-trigger the search effect every render.
  const onSearchRef = React.useRef(onSearch);
  React.useEffect(() => {
    onSearchRef.current = onSearch;
  });
  const hasSearch = Boolean(onSearch);

  const runSearch = React.useCallback((search: string) => {
    const search$ = onSearchRef.current;
    if (!search$) return;
    const requestId = ++requestIdRef.current;
    startTransition(async () => {
      try {
        const res = await search$(search);
        if (requestId !== requestIdRef.current) return;
        for (const option of res) cacheRef.current?.set(option.value, option);
        setResults(res);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setResults([]);
      }
    });
  }, []);

  React.useEffect(() => {
    if (!hasSearch || !open) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!effectiveQuery) {
      runSearch('');
      return;
    }

    debounceTimerRef.current = setTimeout(() => runSearch(effectiveQuery), debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [effectiveQuery, hasSearch, open, debounceMs, runSearch]);

  const items = React.useMemo(() => {
    let list: ComboboxOption[];
    if (onSearch) {
      list = results;
    } else if (!options) {
      list = [];
    } else if (!effectiveQuery) {
      list = options;
    } else {
      list = options.filter((option) => option.label.toLowerCase().includes(effectiveQuery.toLowerCase()));
    }
    return maxResults ? list.slice(0, maxResults) : list;
  }, [onSearch, results, options, effectiveQuery, maxResults]);

  const commit = (next: string[]) => {
    field.handleChange(multiple ? next : (next[0] ?? ''));
  };

  const firstValue = selectedValues[0];
  const singleLabel = !multiple ? getOption(firstValue)?.label : undefined;
  const inputValue = open ? query : multiple ? '' : (singleLabel ?? firstValue ?? '');

  const closeMenu = () => {
    setOpen(false);
    setQuery('');
    setTyped(false);
  };

  const handleFocus = () => {
    setOpen(true);
    setTyped(false);
    if (!multiple && singleLabel) {
      setQuery(singleLabel);
      requestAnimationFrame(() => inputRef.current?.select());
    } else {
      setQuery('');
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node | null)) return;
    field.handleBlur();
    closeMenu();
  };

  const handleSelect = (option: ComboboxOption) => {
    cacheRef.current?.set(option.value, option);
    if (multiple) {
      const next = selectedValues.includes(option.value)
        ? selectedValues.filter((value) => value !== option.value)
        : [...selectedValues, option.value];
      commit(next);
      setQuery('');
      setTyped(false);
      inputRef.current?.focus();
      return;
    }
    commit([option.value]);
    closeMenu();
    inputRef.current?.blur();
  };

  const removeValue = (value: string) => {
    commit(selectedValues.filter((current) => current !== value));
  };

  const handleValueChange = (value: string) => {
    setQuery(value);
    setTyped(true);
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      inputRef.current?.blur();
      return;
    }
    if (multiple && e.key === 'Backspace' && query === '' && selectedValues.length > 0) {
      removeValue(selectedValues[selectedValues.length - 1]);
    }
  };

  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4';
  const showPlaceholder = multiple ? selectedValues.length === 0 : true;

  return (
    <Field className='gap-2' data-invalid={!isValid}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Command shouldFilter={false} className='h-auto overflow-visible bg-transparent'>
        <Popover open={open}>
          <PopoverAnchor asChild>
            <div
              ref={containerRef}
              aria-invalid={!isValid || undefined}
              className={cn('flex w-full flex-wrap items-center', shellVariants[variant], shellSizes[size])}
              onMouseDown={(e) => {
                if (e.target !== inputRef.current) {
                  e.preventDefault();
                  inputRef.current?.focus();
                }
              }}
            >
              <Search className={cn('shrink-0 text-muted-foreground', iconSize)} aria-hidden />
              {multiple &&
                selectedValues.map((value) => (
                  <Badge key={value} variant='secondary' className='gap-1'>
                    {getOption(value)?.label ?? value}
                    <button
                      type='button'
                      className='cursor-pointer rounded-full outline-none focus-visible:ring-1 focus-visible:ring-ring'
                      onMouseDown={(e) => {
                        e.preventDefault();
                        removeValue(value);
                      }}
                      aria-label={`Remove ${getOption(value)?.label ?? value}`}
                    >
                      <X className='size-3' />
                    </button>
                  </Badge>
                ))}
              <CommandPrimitive.Input
                ref={inputRef}
                value={inputValue}
                placeholder={showPlaceholder ? placeholder : undefined}
                aria-label={label}
                aria-invalid={!isValid || undefined}
                onValueChange={handleValueChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className='min-w-20 flex-1 bg-transparent outline-hidden placeholder:text-muted-foreground'
              />
              {isPending && <Loader2 className={cn('shrink-0 animate-spin text-muted-foreground', iconSize)} />}
            </div>
          </PopoverAnchor>
          <PopoverContent
            align='start'
            sideOffset={8}
            {...NO_POPUP_ROLE}
            className='overflow-hidden p-0'
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            style={{ width: 'var(--radix-popover-trigger-width)' }}
          >
            <CommandList className='max-h-60'>
              {items.length === 0 ? (
                <div className='py-6 text-center text-sm text-muted-foreground'>
                  {isPending ? 'Searching…' : emptyText}
                </div>
              ) : (
                <CommandGroup>
                  {items.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => handleSelect(option)}
                        className='cursor-pointer'
                      >
                        <Check className={isSelected ? 'opacity-100' : 'opacity-0'} />
                        <div className='flex flex-col'>
                          <span>{option.label}</span>
                          {option.sublabel && <span className='text-xs text-muted-foreground'>{option.sublabel}</span>}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </PopoverContent>
        </Popover>
      </Command>
      {!isValid && (
        <FieldError
          className='text-xs text-left'
          errors={errors.map((error) => ({ message: typeof error === 'string' ? error : error?.message }))}
        />
      )}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
