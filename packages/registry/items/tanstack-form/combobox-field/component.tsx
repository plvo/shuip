'use client';

import { Check, Loader2, X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';

const DEBOUNCE_TIME = 300;

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface ComboboxFieldProps {
  multiple?: boolean;
  options?: ComboboxOption[];
  onSearch?: (query: string) => Promise<ComboboxOption[]>;
  defaultSelected?: ComboboxOption | ComboboxOption[];
  maxResults?: number;
  label?: string;
  description?: string;
  placeholder?: string;
  emptyText?: string;
  debounceMs?: number;
  fieldProps?: React.ComponentProps<typeof Field>;
  props?: Omit<React.ComponentProps<'input'>, 'value' | 'onChange'>;
}

function toArray(value: string | string[] | undefined | null): string[] {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
}

export function ComboboxField({
  multiple = false,
  options,
  onSearch,
  defaultSelected,
  maxResults,
  label,
  description,
  placeholder,
  emptyText = 'No results',
  debounceMs = DEBOUNCE_TIME,
  fieldProps,
  props,
}: ComboboxFieldProps) {
  // The consumer declares the field value type (string single / string[] multi); both shapes
  // are normalised through `toArray`, so the context is read at the shared union here.
  const field = useFieldContext<string | string[]>();
  const { isValid, errors } = field.state.meta;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<ComboboxOption[]>([]);
  const [isPending, startTransition] = React.useTransition();
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = React.useRef(0);

  const cacheRef = React.useRef<Map<string, ComboboxOption>>(new Map());
  React.useMemo(() => {
    const initial = Array.isArray(defaultSelected) ? defaultSelected : defaultSelected ? [defaultSelected] : [];
    for (const option of initial) cacheRef.current.set(option.value, option);
  }, [defaultSelected]);

  const selectedValues = toArray(field.state.value);

  const cacheOptions = React.useCallback((items: ComboboxOption[]) => {
    for (const option of items) cacheRef.current.set(option.value, option);
  }, []);

  React.useEffect(() => {
    if (options) cacheOptions(options);
  }, [options, cacheOptions]);

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

    if (!query) {
      requestIdRef.current++;
      runSearch('');
      return;
    }

    debounceTimerRef.current = setTimeout(() => runSearch(query), debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, onSearch, open, debounceMs, runSearch]);

  const items = React.useMemo(() => {
    let list: ComboboxOption[];
    if (onSearch) {
      list = results;
    } else if (!options) {
      list = [];
    } else if (!query) {
      list = options;
    } else {
      list = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));
    }
    return maxResults ? list.slice(0, maxResults) : list;
  }, [onSearch, results, options, query, maxResults]);

  const commit = (next: string[]) => {
    field.handleChange(multiple ? next : (next[0] ?? ''));
  };

  const handleSelect = (option: ComboboxOption) => {
    cacheRef.current.set(option.value, option);
    if (multiple) {
      const next = selectedValues.includes(option.value)
        ? selectedValues.filter((value) => value !== option.value)
        : [...selectedValues, option.value];
      commit(next);
      setQuery('');
      return;
    }
    commit([option.value]);
    setQuery('');
    setOpen(false);
  };

  const removeValue = (value: string) => {
    commit(selectedValues.filter((current) => current !== value));
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    setQuery('');
    if (!next) field.handleBlur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (multiple && e.key === 'Backspace' && query === '' && selectedValues.length > 0) {
      removeValue(selectedValues[selectedValues.length - 1]);
    }
  };

  const id = props?.id ?? field.name;
  const singleLabel = !multiple ? cacheRef.current.get(selectedValues[0])?.label : undefined;
  const inputValue = open ? query : (singleLabel ?? '');

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <Command shouldFilter={false} className='overflow-visible bg-transparent'>
          <PopoverAnchor asChild>
            <div
              className='border-input flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border bg-transparent px-2 py-1 shadow-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_[data-slot=command-input-wrapper]]:flex-1 [&_[data-slot=command-input-wrapper]]:border-0 [&_[data-slot=command-input-wrapper]]:px-0'
              aria-invalid={!isValid}
            >
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
              <CommandInput
                {...props}
                id={id}
                value={inputValue}
                placeholder={multiple && selectedValues.length > 0 ? undefined : placeholder}
                onValueChange={setQuery}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                aria-invalid={!isValid}
                className='h-7'
              />
              {isPending && <Loader2 className='size-4 shrink-0 animate-spin text-muted-foreground' />}
            </div>
          </PopoverAnchor>
          <PopoverContent
            className='p-0'
            align='start'
            onOpenAutoFocus={(e) => e.preventDefault()}
            style={{ width: 'var(--radix-popover-trigger-width)' }}
          >
            <CommandList className='max-h-60'>
              <CommandEmpty>{isPending ? 'Searching…' : emptyText}</CommandEmpty>
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
            </CommandList>
          </PopoverContent>
        </Command>
      </Popover>
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
