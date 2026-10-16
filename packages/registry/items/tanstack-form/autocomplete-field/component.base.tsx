'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover } from '@/components/ui/popover';
import { SuggestionEmpty, SuggestionOption, useSuggestionList } from '@/components/ui/shuip/suggestion-list';
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
  const [isPending, startTransition] = React.useTransition();
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = React.useRef(0);
  const anchorRef = React.useRef<HTMLDivElement>(null);

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
      requestIdRef.current++;
      setResults([]);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current;
      startTransition(async () => {
        try {
          const res = await onSearch(query);
          if (requestId !== requestIdRef.current) return;
          setResults(res);
        } catch {
          if (requestId !== requestIdRef.current) return;
          setResults([]);
        }
      });
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      requestIdRef.current++;
    };
  }, [query, onSearch, open, debounceMs]);

  const handleSelect = (value: string) => {
    field.handleChange(value);
    setOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (e.key === 'Tab') {
      setOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (items.length === 0) return;

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
    }
  };

  const handleBlur = () => {
    field.handleBlur();
    setTimeout(() => {
      setOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  const id = props?.id ?? field.name;
  const suggestionList = useSuggestionList({
    inputId: id,
    label,
    ariaLabel: props?.['aria-label'],
    placeholder,
    open,
    count: items.length,
    selectedIndex,
    busy: isPending,
  });

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && (
        <FieldLabel id={suggestionList.labelId} htmlFor={id}>
          {label}
        </FieldLabel>
      )}
      <Popover
        open={open}
        onOpenChange={(nextOpen, { reason, event }) => {
          if (reason === 'outside-press' && anchorRef.current?.contains(event.target as Node)) return;
          setOpen(nextOpen);
        }}
      >
        <div ref={anchorRef} className='relative'>
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
            onClick={() => setOpen(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            {...suggestionList.inputProps}
            aria-invalid={!isValid}
          />
          {isPending && (
            <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
              <Loader2 className='size-4 animate-spin text-muted-foreground' />
            </div>
          )}
        </div>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner anchor={anchorRef} align='start' sideOffset={4} className='isolate z-50'>
            <PopoverPrimitive.Popup
              data-slot='popover-content'
              {...suggestionList.listboxProps}
              initialFocus={false}
              className={cn(
                'z-50 flex w-72 origin-(--transform-origin) flex-col gap-4 rounded-md bg-popover p-4 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
                suggestionList.listboxProps.className,
              )}
              style={{ width: 'var(--anchor-width)' }}
            >
              {items.length === 0 && <SuggestionEmpty>{isPending ? 'Searching…' : emptyText}</SuggestionEmpty>}
              {items.map((item, index) => (
                <SuggestionOption
                  key={`${item}-${index}`}
                  id={suggestionList.optionId(index)}
                  selected={selectedIndex === index}
                  onSelect={() => handleSelect(item)}
                  onHighlight={() => setSelectedIndex(index)}
                >
                  {item}
                </SuggestionOption>
              ))}
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
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
