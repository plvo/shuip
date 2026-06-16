'use client';

import type { Lens } from '@hookform/lenses';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, Loader2, Search, X } from 'lucide-react';
import * as React from 'react';
import { useController } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

const DEBOUNCE_TIME = 300;

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

type ComboboxFieldVariant = 'boxed' | 'ghost';
type ComboboxFieldSize = 'sm' | 'default';

type ComboboxFieldCommonProps = {
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
};

export type ComboboxFieldProps =
  | (ComboboxFieldCommonProps & {
      multiple?: false;
      lens: Lens<string>;
      defaultSelected?: ComboboxOption;
    })
  | (ComboboxFieldCommonProps & {
      multiple: true;
      lens: Lens<string[]>;
      defaultSelected?: ComboboxOption[];
    });

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

export function ComboboxField(props: ComboboxFieldProps) {
  const {
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
  } = props;

  // The discriminated union ties the lens type to `multiple`; values are normalised through
  // `toArray`, so the interop binding is widened to the shared string | string[] shape here.
  const { field, fieldState } = useController((props.lens as Lens<string | string[]>).interop());

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [typed, setTyped] = React.useState(false);
  const [results, setResults] = React.useState<ComboboxOption[]>([]);
  const [isPending, startTransition] = React.useTransition();
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = React.useRef(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Populated during render so a preset/selected value can show its label before any
  // search runs; async results are added in `runSearch`, manual picks in `handleSelect`.
  const cacheRef = React.useRef<Map<string, ComboboxOption>>(new Map());
  React.useMemo(() => {
    const seed = Array.isArray(defaultSelected) ? defaultSelected : defaultSelected ? [defaultSelected] : [];
    for (const option of [...seed, ...(options ?? [])]) cacheRef.current.set(option.value, option);
  }, [defaultSelected, options]);

  const selectedValues = toArray(field.value);

  // A pre-filled-but-untouched single label counts as an empty query, so the full list
  // (or `onSearch('')` recents) shows on focus instead of filtering down to the label.
  const effectiveQuery = typed ? query : '';

  const cacheOptions = React.useCallback((items: ComboboxOption[]) => {
    for (const option of items) cacheRef.current.set(option.value, option);
  }, []);

  const runSearch = React.useCallback(
    (search: string) => {
      if (!onSearch) return;
      const requestId = ++requestIdRef.current;
      startTransition(async () => {
        try {
          const res = await onSearch(search);
          if (requestId !== requestIdRef.current) return;
          cacheOptions(res);
          setResults(res);
        } catch {
          if (requestId !== requestIdRef.current) return;
          setResults([]);
        }
      });
    },
    [onSearch, cacheOptions],
  );

  React.useEffect(() => {
    if (!onSearch || !open) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!effectiveQuery) {
      requestIdRef.current++;
      runSearch('');
      return;
    }

    debounceTimerRef.current = setTimeout(() => runSearch(effectiveQuery), debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [effectiveQuery, onSearch, open, debounceMs, runSearch]);

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
    field.onChange(multiple ? next : (next[0] ?? ''));
  };

  const singleLabel = !multiple ? cacheRef.current.get(selectedValues[0])?.label : undefined;
  const inputValue = open ? query : (singleLabel ?? '');

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
    field.onBlur();
    closeMenu();
  };

  const handleSelect = (option: ComboboxOption) => {
    cacheRef.current.set(option.value, option);
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

  const id = field.name;
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4';
  const showPlaceholder = multiple ? selectedValues.length === 0 : true;

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <Command shouldFilter={false} className='relative h-auto overflow-visible bg-transparent'>
        <div
          ref={containerRef}
          aria-invalid={fieldState.invalid || undefined}
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
                {cacheRef.current.get(value)?.label ?? value}
                <button
                  type='button'
                  className='cursor-pointer rounded-full outline-none focus-visible:ring-1 focus-visible:ring-ring'
                  onMouseDown={(e) => {
                    e.preventDefault();
                    removeValue(value);
                  }}
                  aria-label={`Remove ${cacheRef.current.get(value)?.label ?? value}`}
                >
                  <X className='size-3' />
                </button>
              </Badge>
            ))}
          <CommandPrimitive.Input
            ref={inputRef}
            id={id}
            value={inputValue}
            placeholder={showPlaceholder ? placeholder : undefined}
            autoComplete='off'
            aria-invalid={fieldState.invalid || undefined}
            aria-expanded={open}
            onValueChange={handleValueChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className='min-w-20 flex-1 bg-transparent outline-hidden placeholder:text-muted-foreground'
          />
          {isPending && <Loader2 className={cn('shrink-0 animate-spin text-muted-foreground', iconSize)} />}
        </div>
        {open && (
          <div
            className='absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md'
            onMouseDown={(e) => e.preventDefault()}
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
                        keywords={[option.label]}
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
          </div>
        )}
      </Command>
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
