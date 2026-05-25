'use client';

import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { cn } from '@/lib/utils';

const DEBOUNCE_TIME = 300;

function defaultFilter(suggestion: string, query: string) {
  return suggestion.toLowerCase().includes(query.toLowerCase());
}

export interface AutocompleteFieldProps {
  label?: string;
  description?: string;
  placeholder?: string;
  suggestions?: string[];
  onSearch?: (query: string) => Promise<string[]>;
  emptyText?: string;
  debounceMs?: number;
  filter?: (suggestion: string, query: string) => boolean;
  fieldProps?: React.ComponentProps<typeof Field>;
  props?: Omit<React.ComponentProps<'input'>, 'value' | 'onChange'>;
}

export function AutocompleteField({
  label,
  description,
  placeholder,
  suggestions,
  onSearch,
  emptyText = 'No results',
  debounceMs = DEBOUNCE_TIME,
  filter = defaultFilter,
  fieldProps,
  props,
}: AutocompleteFieldProps) {
  const field = useFieldContext<string>();
  const { isValid, errors } = field.state.meta;

  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [results, setResults] = React.useState<string[]>([]);
  const [isPending, setIsPending] = React.useState(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = React.useRef(0);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const query = field.state.value ?? '';

  const items = React.useMemo(() => {
    if (onSearch) return results;
    if (!suggestions) return [];
    if (!query) return suggestions;
    return suggestions.filter((suggestion) => filter(suggestion, query));
  }, [onSearch, results, suggestions, query, filter]);

  React.useEffect(() => {
    if (!onSearch || !open) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query) {
      setResults([]);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current;
      setIsPending(true);
      onSearch(query)
        .then((res) => {
          if (requestId !== requestIdRef.current) return;
          setResults(res);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setResults([]);
        })
        .finally(() => {
          if (requestId !== requestIdRef.current) return;
          setIsPending(false);
        });
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, onSearch, open, debounceMs]);

  const handleSelect = (value: string) => {
    field.handleChange(value);
    setOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          handleSelect(items[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (popoverRef.current?.contains(relatedTarget)) {
      return;
    }
    field.handleBlur();
    setTimeout(() => {
      setOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  const id = props?.id ?? field.name;

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className='relative'>
            <Input
              name={field.name}
              value={query}
              placeholder={placeholder}
              autoComplete='off'
              {...props}
              id={id}
              onChange={(e) => {
                field.handleChange(e.target.value);
                setOpen(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => setOpen(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              aria-invalid={!isValid}
            />
            {isPending && (
              <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                <Loader2 className='size-4 animate-spin text-muted-foreground' />
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          ref={popoverRef}
          className='p-0'
          align='start'
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <Command shouldFilter={false} className='w-full'>
            <CommandList className='max-h-60'>
              <CommandEmpty>{isPending ? 'Searching…' : emptyText}</CommandEmpty>
              <CommandGroup>
                {items.map((item, index) => (
                  <CommandItem
                    key={item}
                    value={item}
                    onSelect={() => handleSelect(item)}
                    className={cn('cursor-pointer', selectedIndex === index && 'bg-accent')}
                  >
                    {item}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
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
