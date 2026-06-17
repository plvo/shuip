# search-input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a language-agnostic, fully configurable search input as a shuip registry item under `components/search-input`.

**Architecture:** A single `component.tsx` wraps shadcn `Input` + `Popover` with debounced `onChange`, an optional keyboard shortcut (hotkey) to focus the input, and a visual badge + tooltip showing the hotkey. All native input props flow through via rest spread. Three examples cover the main usage patterns. No test runner is configured — validation is via Biome (`bun check`) and the registry generator + docs build.

**Tech Stack:** React 19, shadcn/ui (`input`, `popover`), lucide-react (`Search`), Tailwind v4, Biome, Bun.

## Global Constraints

- All commands run from `/home/ttecim/.lab/shuip/.claude/worktrees/feat/search-input/` (the feature worktree).
- Package manager: `bun` only — never `npm` or `yarn`.
- Linter/formatter: Biome (`bun check`). No ESLint/Prettier.
- Imports of shadcn primitives: `@/components/ui/<name>` (becomes a `registryDependency`).
- Examples import via stub alias: `@/components/ui/shuip/search-input`.
- No `index.mdx` for blocks — this is a `components` item, so `index.mdx` is required.
- Never edit generated artifacts: `registry.json`, `__index__.ts`, `stubs/`, `apps/docs/public/r/`.
- Folder name must be unprefixed: `search-input` (no `rhf-`, `tsf-` prefix).
- `component.tsx` must not import from `@/components/ui/shuip/*`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `packages/registry/items/components/search-input/component.tsx` | Published component + props interface |
| Create | `packages/registry/items/components/search-input/default.example.tsx` | Basic controlled usage |
| Create | `packages/registry/items/components/search-input/with-hotkey.example.tsx` | Custom hotkey key + tooltip |
| Create | `packages/registry/items/components/search-input/no-hotkey.example.tsx` | hotkey disabled |
| Create | `packages/registry/items/components/search-input/index.mdx` | Doc page |

---

## Task 1: Write `component.tsx`

**Files:**
- Create: `packages/registry/items/components/search-input/component.tsx`

**Interfaces:**
- Consumes: `Input` from `@/components/ui/input`, `Popover`/`PopoverContent`/`PopoverTrigger` from `@/components/ui/popover`, `Search` from `lucide-react`
- Produces: `SearchInput`, `SearchInputProps` — used by all example files

- [ ] **Step 1: Create the component file**

Create `packages/registry/items/components/search-input/component.tsx` with:

```tsx
'use client';

import { Search } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export interface SearchInputProps extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  onChange: (value: string) => void;
  debounceMs?: number;
  hotkey?: string | false;
  hotkeyTooltip?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  debounceMs = 250,
  hotkey = '/',
  hotkeyTooltip,
  autoFocus,
  className,
  ...props
}: SearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [text, setText] = React.useState(typeof value === 'string' ? value : '');
  const [focused, setFocused] = React.useState(false);
  const [hintOpen, setHintOpen] = React.useState(false);

  const resolvedTooltip = hotkeyTooltip ?? (hotkey ? `Press ${hotkey} to search` : undefined);

  React.useEffect(() => {
    if (typeof value === 'string') setText(value);
  }, [value]);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  React.useEffect(() => {
    if (!hotkey) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== hotkey || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hotkey]);

  function handleChange(next: string) {
    setText(next);
    if (timer.current) clearTimeout(timer.current);
    if (debounceMs <= 0) {
      onChange(next);
      return;
    }
    timer.current = setTimeout(() => onChange(next), debounceMs);
  }

  const showHotkeyBadge = Boolean(hotkey) && !focused && text.length === 0;

  return (
    <div className={cn('relative', className)}>
      <Search aria-hidden className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        {...props}
        ref={inputRef}
        type='search'
        placeholder={placeholder}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        // biome-ignore lint/a11y/noAutofocus: opt-in via prop, off by default
        autoFocus={autoFocus}
        className={cn('h-9 pl-9', showHotkeyBadge && 'pr-9')}
      />
      {showHotkeyBadge && (
        <Popover open={hintOpen} onOpenChange={setHintOpen}>
          <PopoverTrigger
            type='button'
            aria-label={resolvedTooltip}
            onClick={() => inputRef.current?.focus()}
            onMouseEnter={() => setHintOpen(true)}
            onMouseLeave={() => setHintOpen(false)}
            className='absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
          >
            {hotkey}
          </PopoverTrigger>
          <PopoverContent
            side='top'
            align='end'
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className='w-auto p-2 text-xs text-muted-foreground'
          >
            {resolvedTooltip}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify Biome passes**

```bash
bun check packages/registry/items/components/search-input/component.tsx
```

Expected: no errors, no warnings.

- [ ] **Step 3: Commit**

```bash
git add packages/registry/items/components/search-input/component.tsx
git commit -m "feat(search-input): add component"
```

---

## Task 2: Write examples and `index.mdx`

**Files:**
- Create: `packages/registry/items/components/search-input/default.example.tsx`
- Create: `packages/registry/items/components/search-input/with-hotkey.example.tsx`
- Create: `packages/registry/items/components/search-input/no-hotkey.example.tsx`
- Create: `packages/registry/items/components/search-input/index.mdx`

**Interfaces:**
- Consumes: `SearchInput`, `SearchInputProps` from `@/components/ui/shuip/search-input` (stub alias)

- [ ] **Step 1: Create `default.example.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { SearchInput } from '@/components/ui/shuip/search-input';

export default function SearchInputExample() {
  const [query, setQuery] = useState('');
  return (
    <div className='flex w-full max-w-sm flex-col gap-2'>
      <SearchInput value={query} onChange={setQuery} placeholder='Search…' />
      {query && <p className='text-sm text-muted-foreground'>Query: {query}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Create `with-hotkey.example.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { SearchInput } from '@/components/ui/shuip/search-input';

export default function SearchInputWithHotkeyExample() {
  const [query, setQuery] = useState('');
  return (
    <SearchInput
      value={query}
      onChange={setQuery}
      hotkey='k'
      hotkeyTooltip='Press K to search'
      placeholder='Search…'
      className='w-full max-w-sm'
    />
  );
}
```

- [ ] **Step 3: Create `no-hotkey.example.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { SearchInput } from '@/components/ui/shuip/search-input';

export default function SearchInputNoHotkeyExample() {
  const [query, setQuery] = useState('');
  return (
    <SearchInput
      value={query}
      onChange={setQuery}
      hotkey={false}
      placeholder='Filter items…'
      className='w-full max-w-sm'
    />
  );
}
```

- [ ] **Step 4: Create `index.mdx`**

```mdx
---
title: Search Input
description: A debounced search input with optional keyboard shortcut and hotkey badge.
registryName: search-input
---

import { TypeTable } from 'fumadocs-ui/components/type-table';

A controlled search input with built-in debounce. Press a configurable hotkey (default `/`) to focus it from anywhere on the page. When the field is empty and unfocused, a badge shows the active hotkey; hovering the badge reveals a tooltip.

## Examples

<ItemExamples registryName={'search-input'} />

## Props

<TypeTable
  type={{
    onChange: {
      description: 'Called with the current string value after the debounce delay.',
      type: '(value: string) => void',
    },
    debounceMs: {
      description: 'Milliseconds to wait after the last keystroke before calling onChange. Set to 0 for immediate calls.',
      type: 'number',
      default: '250',
    },
    hotkey: {
      description: 'Key that focuses the input when pressed outside an editable element. Set to false to disable.',
      type: "string | false",
      default: "'/'",
    },
    hotkeyTooltip: {
      description: 'Text shown in the badge tooltip and used as aria-label. Defaults to "Press {hotkey} to search".',
      type: 'string',
    },
    '...props': {
      description: 'All other native <input> props (placeholder, disabled, name, aria-*, data-*, className, etc.).',
      type: "Omit<React.ComponentProps<'input'>, 'onChange'>",
    },
  }}
/>
```

- [ ] **Step 5: Verify Biome passes on all new files**

```bash
bun check packages/registry/items/components/search-input/
```

Expected: no errors, no warnings.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/items/components/search-input/
git commit -m "feat(search-input): add examples and doc page"
```

---

## Task 3: Generate, verify artifacts, and build

**Files:**
- Verify generated: `packages/registry/registry.json` (entry for `search-input`)
- Verify generated: `packages/registry/stubs/search-input.tsx`
- Verify generated: `apps/docs/content/components/search-input.mdx` (symlink)

- [ ] **Step 1: Run the registry generator**

```bash
bun registry:generate
```

Expected output includes:
- `[generate] N items processed` where N is one more than before (was 6 blocks + components, now +1)
- No line: `[generate] skipping components/search-input: no component.tsx`

- [ ] **Step 2: Verify the registry.json entry**

```bash
node -e "const r = require('./packages/registry/registry.json'); const item = r.items.find(i => i.name === 'search-input'); console.log(JSON.stringify(item, null, 2));"
```

Expected: an object with:
- `"name": "search-input"`
- `"registryDependencies"` containing `"input"` and `"popover"`
- `"dependencies"` containing `"lucide-react"`

- [ ] **Step 3: Verify the stub file exists**

```bash
cat packages/registry/stubs/search-input.tsx
```

Expected: a re-export of `component.tsx`.

- [ ] **Step 4: Verify the MDX symlink**

```bash
ls -la apps/docs/content/components/search-input.mdx
```

Expected: a symlink pointing to `../../../../packages/registry/items/components/search-input/index.mdx` (or similar relative path).

- [ ] **Step 5: Run end-to-end docs build**

```bash
NODE_OPTIONS=--max-old-space-size=6144 bun build:docs 2>&1 | tail -20
```

Expected: build succeeds with no type errors related to `search-input`. Exit code 0.

- [ ] **Step 6: Commit the plan file**

```bash
git add docs/superpowers/plans/2026-06-17-search-input.md
git commit -m "docs: add search-input implementation plan"
```
