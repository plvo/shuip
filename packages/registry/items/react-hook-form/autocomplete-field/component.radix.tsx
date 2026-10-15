'use client';

import type { Lens } from '@hookform/lenses';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { useController } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';

const DEBOUNCE_TIME = 300;

function defaultFilter(suggestion: string, query: string) {
  return suggestion.toLowerCase().includes(query.toLowerCase());
}

export interface AutocompleteFieldProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  lens: Lens<string>;
  label?: string;
  description?: string;
  placeholder?: string;
  suggestions?: string[];
  onSearch?: (query: string) => Promise<string[]>;
  emptyText?: string;
  debounceMs?: number;
  filter?: (suggestion: string, query: string) => boolean;
}

export function AutocompleteField({
  lens,
  label,
  description,
  placeholder,
  suggestions,
  onSearch,
  emptyText = 'No results',
  debounceMs = DEBOUNCE_TIME,
  filter = defaultFilter,
  ...props
}: AutocompleteFieldProps) {
  const { field, fieldState } = useController(lens.interop());

  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [results, setResults] = React.useState<string[]>([]);
  const [isPending, startTransition] = React.useTransition();
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = React.useRef(0);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const query = field.value ?? '';

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
    field.onChange(value);
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

  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (popoverRef.current?.contains(relatedTarget)) {
      return;
    }
    field.onBlur();
    setTimeout(() => {
      setOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  const id = props.id ?? field.name;
  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const activeOptionId =
    open && selectedIndex >= 0 && selectedIndex < items.length ? optionId(selectedIndex) : undefined;
  const listboxName = label ? { 'aria-labelledby': labelId } : { 'aria-label': props['aria-label'] ?? placeholder };

  React.useEffect(() => {
    if (activeOptionId) document.getElementById(activeOptionId)?.scrollIntoView({ block: 'nearest' });
  }, [activeOptionId]);

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && (
        <FieldLabel id={labelId} htmlFor={id}>
          {label}
        </FieldLabel>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className='relative'>
            <Input
              name={field.name}
              value={query}
              placeholder={placeholder}
              autoComplete='off'
              {...props}
              id={id}
              onChange={(e) => {
                field.onChange(e.target.value);
                setOpen(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => setOpen(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              role='combobox'
              aria-autocomplete='list'
              aria-expanded={open}
              aria-controls={open ? listboxId : undefined}
              aria-activedescendant={activeOptionId}
              aria-invalid={fieldState.invalid}
            />
            {isPending && (
              <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                <Loader2 className='size-4 animate-spin text-muted-foreground' />
              </div>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          ref={popoverRef}
          id={listboxId}
          role='listbox'
          {...listboxName}
          aria-busy={isPending}
          className='block max-h-60 overflow-y-auto p-1'
          align='start'
          onOpenAutoFocus={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          {items.length === 0 && (
            <div
              role='option'
              aria-disabled='true'
              aria-selected='false'
              tabIndex={-1}
              className='py-6 text-center text-sm'
            >
              {isPending ? 'Searching…' : emptyText}
            </div>
          )}
          {items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              id={optionId(index)}
              role='option'
              aria-selected={selectedIndex === index}
              tabIndex={-1}
              onClick={() => handleSelect(item)}
              onMouseMove={() => setSelectedIndex(index)}
              className='relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none aria-selected:bg-muted aria-selected:text-foreground'
            >
              {item}
            </div>
          ))}
        </PopoverContent>
      </Popover>
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
