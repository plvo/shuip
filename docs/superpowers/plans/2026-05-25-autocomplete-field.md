# Autocomplete Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a free-text string autocomplete field (`rhf-autocomplete-field` + `tsf-autocomplete-field`) to the shuip registry.

**Architecture:** Each item is a self-contained `component.tsx` modelled on `address-field`'s proven interaction (Input as typing surface + `Popover`/`Command` dropdown, manual keyboard nav, debounce + stale-response guard). Two suggestion modes — static `suggestions: string[]` (client substring filter) and async `onSearch` (debounced fetch). The rhf/tsf pair duplicates the ~100-line core and differs only in form binding (Approach A, accepted deliberately for registry self-containment).

**Tech Stack:** Next.js 16, React 19, TypeScript, `@hookform/lenses` + `react-hook-form` (rhf), `@tanstack/react-form` (tsf), shadcn `command`/`popover`/`input`/`field` primitives, `lucide-react`.

**Testing note:** shuip has no test runner (per `.claude/CLAUDE.md`). Do NOT add one. Each task is verified by the generator + build pipeline and `tsc --noEmit`, plus visual previews on the docs site. This replaces the unit-test loop.

---

## File Structure

- `packages/registry/items/react-hook-form/autocomplete-field/component.tsx` — RHF item source.
- `packages/registry/items/react-hook-form/autocomplete-field/default.example.tsx` — static-mode preview.
- `packages/registry/items/react-hook-form/autocomplete-field/async.example.tsx` — async-mode preview.
- `packages/registry/items/react-hook-form/autocomplete-field/index.mdx` — doc page.
- `packages/registry/items/tanstack-form/autocomplete-field/component.tsx` — TSF item source.
- `packages/registry/items/tanstack-form/autocomplete-field/default.example.tsx` — static-mode preview.
- `packages/registry/items/tanstack-form/autocomplete-field/async.example.tsx` — async-mode preview.
- `packages/registry/items/tanstack-form/autocomplete-field/index.mdx` — doc page.

Generated artifacts (registry.json, __index__.ts, stubs, MDX symlinks, public/r) are produced by `bun registry:generate` / `bun registry:build` — never hand-edited.

---

## Task 1: RHF component.tsx

**Files:**
- Create: `packages/registry/items/react-hook-form/autocomplete-field/component.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';

import type { Lens } from '@hookform/lenses';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { useController } from 'react-hook-form';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
  const [isPending, setIsPending] = React.useState(false);
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
    field.onChange(value);
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
    field.onBlur();
    setTimeout(() => {
      setOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  const id = props.id ?? field.name;

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
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
                field.onChange(e.target.value);
                setOpen(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => setOpen(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              aria-invalid={fieldState.invalid}
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
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
```

- [ ] **Step 2: Typecheck the registry workspace**

Run: `cd packages/registry && bun tsc --noEmit`
Expected: no errors referencing `autocomplete-field` (note: the stub alias resolves only after Task 7 generate; an unresolved `@/components/ui/shuip/...` import does NOT exist yet in this file, so this should be clean).

---

## Task 2: RHF examples

**Files:**
- Create: `packages/registry/items/react-hook-form/autocomplete-field/default.example.tsx`
- Create: `packages/registry/items/react-hook-form/autocomplete-field/async.example.tsx`

- [ ] **Step 1: Write the static-mode example**

`default.example.tsx`:

```tsx
'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { AutocompleteField } from '@/components/ui/shuip/react-hook-form/autocomplete-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const SOURCES = ['LinkedIn', 'IRL', 'Prospection', 'Referral', 'Website', 'Cold call'];

const zodSchema = z.object({
  source: z.string().nonempty({ message: 'Source is required' }),
});

type Values = z.infer<typeof zodSchema>;

export default function AutocompleteFieldExample() {
  const form = useForm<Values>({
    defaultValues: { source: '' },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  function onSubmit(values: Values) {
    alert(`Source: ${values.source}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <AutocompleteField
          lens={lens.focus('source')}
          label='Source'
          description='Pick a known source or type your own'
          placeholder='e.g. LinkedIn'
          suggestions={SOURCES}
        />
        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
```

- [ ] **Step 2: Write the async-mode example**

`async.example.tsx`:

```tsx
'use client';

import { useLens } from '@hookform/lenses';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { AutocompleteField } from '@/components/ui/shuip/react-hook-form/autocomplete-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const FRUITS = [
  'Apple',
  'Apricot',
  'Banana',
  'Blackberry',
  'Blueberry',
  'Cherry',
  'Mango',
  'Melon',
  'Orange',
  'Peach',
];

async function searchFruits(query: string): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return FRUITS.filter((fruit) => fruit.toLowerCase().includes(query.toLowerCase()));
}

const zodSchema = z.object({
  fruit: z.string(),
});

type Values = z.infer<typeof zodSchema>;

export default function AutocompleteFieldAsyncExample() {
  const form = useForm<Values>({ defaultValues: { fruit: '' } });
  const lens = useLens({ control: form.control });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => alert(values.fruit))} className='space-y-4'>
        <AutocompleteField
          lens={lens.focus('fruit')}
          label='Fruit'
          description='Async search with simulated latency'
          placeholder='Search a fruit…'
          onSearch={searchFruits}
        />
        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
```

---

## Task 3: RHF index.mdx

**Files:**
- Create: `packages/registry/items/react-hook-form/autocomplete-field/index.mdx`

- [ ] **Step 1: Write the doc page**

```mdx
---
title: Autocomplete Field
description: Free-text input that suggests matching values from a static list or an async search. The committed value is a plain string — suggestions only propose, they never restrict.
registryName: rhf-autocomplete-field
---

`AutocompleteField` is a text input that proposes matching strings as the user types, while still allowing any free-text value. It binds to React Hook Form through `@hookform/lenses` (`lens` prop) and stores a plain `string`.

Use it when a field has a set of common values worth suggesting (sources, tags, cities…) but you don't want to force the user to pick from the list.

#### Built-in features

- **Two suggestion modes**: a static `suggestions` array (filtered client-side) or an async `onSearch` function (debounced fetch).
- **Free text**: the typed value is always kept — closing the dropdown without selecting commits what was typed.
- **Keyboard navigation**: ArrowUp/ArrowDown to move, Enter to select, Escape to close.
- **Custom matching**: override the default case-insensitive substring match via `filter` (static mode).

import { TypeTable } from 'fumadocs-ui/components/type-table';

## Examples

<ItemExamples registryName={'rhf-autocomplete-field'} />

## Props

<TypeTable
  type={{
    lens: {
      description: 'React Hook Form lens focused on a string field (@hookform/lenses)',
      type: 'Lens<string>',
    },
    label: {
      description: 'Field label text',
      type: 'string?',
    },
    description: {
      description: 'Helper text displayed below the input',
      type: 'string?',
    },
    placeholder: {
      description: 'Input placeholder',
      type: 'string?',
    },
    suggestions: {
      description: 'Static list of suggestions, filtered client-side. Ignored when onSearch is provided.',
      type: 'string[]?',
    },
    onSearch: {
      description: 'Async resolver called with the current query; its result is shown as-is. Takes precedence over suggestions.',
      type: '((query: string) => Promise<string[]>)?',
    },
    emptyText: {
      description: 'Message shown when there are no matches',
      type: 'string?',
      default: "'No results'",
    },
    debounceMs: {
      description: 'Debounce delay before calling onSearch (async mode only)',
      type: 'number?',
      default: '300',
    },
    filter: {
      description: 'Custom matcher for static mode; defaults to case-insensitive substring',
      type: '((suggestion: string, query: string) => boolean)?',
    },
  }}
/>
```

---

## Task 4: TSF component.tsx

**Files:**
- Create: `packages/registry/items/tanstack-form/autocomplete-field/component.tsx`

- [ ] **Step 1: Write the component**

```tsx
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
```

---

## Task 5: TSF examples

**Files:**
- Create: `packages/registry/items/tanstack-form/autocomplete-field/default.example.tsx`
- Create: `packages/registry/items/tanstack-form/autocomplete-field/async.example.tsx`

- [ ] **Step 1: Write the static-mode example**

`default.example.tsx`:

```tsx
'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { AutocompleteField } from '@/components/ui/shuip/tanstack-form/autocomplete-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const SOURCES = ['LinkedIn', 'IRL', 'Prospection', 'Referral', 'Website', 'Cold call'];

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { AutocompleteField },
  formComponents: { SubmitButton },
});

export default function TsfAutocompleteFieldExample() {
  const form = useAppForm({
    defaultValues: {
      source: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <form.AppField
        name='source'
        validators={{
          onChange: ({ value }) => (value.length === 0 ? 'Source is required' : undefined),
        }}
        children={(field) => (
          <field.AutocompleteField
            label='Source'
            description='Pick a known source or type your own'
            placeholder='e.g. LinkedIn'
            suggestions={SOURCES}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Submit</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
```

- [ ] **Step 2: Write the async-mode example**

`async.example.tsx`:

```tsx
'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { AutocompleteField } from '@/components/ui/shuip/tanstack-form/autocomplete-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const FRUITS = [
  'Apple',
  'Apricot',
  'Banana',
  'Blackberry',
  'Blueberry',
  'Cherry',
  'Mango',
  'Melon',
  'Orange',
  'Peach',
];

async function searchFruits(query: string): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return FRUITS.filter((fruit) => fruit.toLowerCase().includes(query.toLowerCase()));
}

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { AutocompleteField },
  formComponents: { SubmitButton },
});

export default function TsfAutocompleteFieldAsyncExample() {
  const form = useAppForm({
    defaultValues: {
      fruit: '',
    },
    onSubmit: async ({ value }) => {
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <form.AppField
        name='fruit'
        children={(field) => (
          <field.AutocompleteField
            label='Fruit'
            description='Async search with simulated latency'
            placeholder='Search a fruit…'
            onSearch={searchFruits}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Submit</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
```

---

## Task 6: TSF index.mdx

**Files:**
- Create: `packages/registry/items/tanstack-form/autocomplete-field/index.mdx`

- [ ] **Step 1: Write the doc page**

```mdx
---
title: Autocomplete Field
description: Free-text input that suggests matching values from a static list or an async search, integrated with TanStack Form via React context. The committed value is a plain string.
registryName: tsf-autocomplete-field
---

`AutocompleteField` is a text input that proposes matching strings as the user types, while still allowing any free-text value. It reads the surrounding field via `useFieldContext`, so you compose it inside a `<form.AppField>` rather than passing a `form` instance by prop. It stores a plain `string`.

#### Built-in features

- **Two suggestion modes**: a static `suggestions` array (filtered client-side) or an async `onSearch` function (debounced fetch).
- **Free text**: the typed value is always kept — closing the dropdown without selecting commits what was typed.
- **Keyboard navigation**: ArrowUp/ArrowDown to move, Enter to select, Escape to close.
- **Custom matching**: override the default case-insensitive substring match via `filter` (static mode).

## Setup

Field components are bound via React context. In your project, create `lib/form.ts` once:

```tsx
// lib/form.ts
import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { AutocompleteField } from '@/components/ui/shuip/tanstack-form/autocomplete-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { AutocompleteField },
  formComponents: { SubmitButton },
});
```

See the [`form-context`](/docs/tanstack-form/form-context) item for details.

import { TypeTable } from 'fumadocs-ui/components/type-table';

## Examples

<ItemExamples registryName={'tsf-autocomplete-field'} />

## Props

<TypeTable
  type={{
    label: {
      description: 'Field label text',
      type: 'string?',
    },
    description: {
      description: 'Helper text displayed below the input',
      type: 'string?',
    },
    placeholder: {
      description: 'Input placeholder',
      type: 'string?',
    },
    suggestions: {
      description: 'Static list of suggestions, filtered client-side. Ignored when onSearch is provided.',
      type: 'string[]?',
    },
    onSearch: {
      description: 'Async resolver called with the current query; its result is shown as-is. Takes precedence over suggestions.',
      type: '((query: string) => Promise<string[]>)?',
    },
    emptyText: {
      description: 'Message shown when there are no matches',
      type: 'string?',
      default: "'No results'",
    },
    debounceMs: {
      description: 'Debounce delay before calling onSearch (async mode only)',
      type: 'number?',
      default: '300',
    },
    filter: {
      description: 'Custom matcher for static mode; defaults to case-insensitive substring',
      type: '((suggestion: string, query: string) => boolean)?',
    },
    fieldProps: {
      description: 'Props passed to the Field wrapper component',
      type: 'React.ComponentProps<typeof Field>?',
    },
    props: {
      description: 'Native HTML input props (placeholder, disabled, etc.)',
      type: "Omit<React.ComponentProps<'input'>, 'value' | 'onChange'>?",
    },
  }}
/>
```

---

## Task 7: Generate registry artifacts

**Files:**
- Auto-generated: `registry.json`, `__index__.ts`, `stubs/**`, MDX symlinks.

- [ ] **Step 1: Run the generator**

Run: `bun registry:generate`
Expected: `[generate] N items processed` with N increased by 2 vs the prior count. NO `[generate] skipping react-hook-form/autocomplete-field: no component.tsx` and NO `skipping tanstack-form/autocomplete-field` warnings.

- [ ] **Step 2: Verify artifacts**

Run: `git status --short packages/registry apps/docs/content`
Expected to see (untracked/modified): `registry.json`, `__index__.ts`, `stubs/react-hook-form/autocomplete-field.tsx`, `stubs/tanstack-form/autocomplete-field.tsx`, and symlinks `apps/docs/content/docs/react-hook-form/autocomplete-field.mdx`, `apps/docs/content/docs/tanstack-form/autocomplete-field.mdx`.

Run: `grep -c "autocomplete-field" packages/registry/registry.json`
Expected: at least 2 (one per item; more counting examples keys).

Inspect the new entries: confirm `registryDependencies` includes `command`, `popover`, `input`, `field`, and `dependencies` includes `lucide-react`.

---

## Task 8: End-to-end build and commit

- [ ] **Step 1: Build docs end-to-end**

Run: `bun build:docs`
Expected: chains generate → registry:build → next build, exits 0. Confirm `apps/docs/public/r/rhf-autocomplete-field.json` and `apps/docs/public/r/tsf-autocomplete-field.json` exist.

- [ ] **Step 2: Biome check**

Run: `bun check`
Expected: no errors on the new files (formatting auto-applied).

- [ ] **Step 3: Commit**

```bash
git add packages/registry apps/docs docs/superpowers
git commit -m "feat(autocomplete-field): add rhf-autocomplete-field and tsf-autocomplete-field"
```

---

## Task 9: Open the PR

- [ ] **Step 1: Push and open PR**

```bash
git push -u origin feat/input-autocomplete
gh pr create --title "feat(autocomplete-field): add rhf- and tsf-autocomplete-field" \
  --body "Adds a free-text string autocomplete field to the registry (RHF + TSF). Static \`suggestions\` list (client substring filter) or async \`onSearch\` (debounced). Modelled on the address-field interaction pattern. Spec: docs/superpowers/specs/2026-05-25-autocomplete-field-design.md"
```

Expected: PR URL returned.

---

## Self-Review

- **Spec coverage:** both items (rhf/tsf) ✓; static + async modes ✓ (Tasks 1/4 logic, 2/5 examples); free text via field value ✓; Famille-A behaviour ✓; props `lens`/`suggestions`/`onSearch`/`emptyText`/`debounceMs`/`filter` ✓; `filter` static-only (async branch returns `results` before filter) ✓; address-field interaction model ✓; deps auto-detected ✓; verification via generate+build ✓.
- **Placeholder scan:** no TBD/TODO; all code blocks complete.
- **Type consistency:** `AutocompleteFieldProps`, `AutocompleteField`, `defaultFilter`, `handleSelect`, `handleKeyDown`, `handleBlur` names consistent across rhf/tsf; `registryName` values (`rhf-autocomplete-field`/`tsf-autocomplete-field`) match folder + prefix; example default exports unique per file.
