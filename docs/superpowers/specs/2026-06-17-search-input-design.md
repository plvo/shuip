# Design — `search-input`

**Date:** 2026-06-17  
**Category:** `components`  
**Registry name:** `search-input`  
**Source reference:** `kodex/packages/ui/src/components/ui/search-input.tsx`

---

## Goal

Publish a language-agnostic, fully configurable search input as a shuip registry item. The source component is a well-designed debounced search input with hotkey support, but it has hardcoded French strings and a fixed icon. The goal is to make it usable in any project without modification.

---

## What changes from the source

| Source | This item |
|---|---|
| Hardcoded placeholder `"Rechercher…"` | Comes from `ComponentProps<'input'>` — default `"Search…"` set at call site or left to browser |
| Hardcoded French tooltip `"Appuyer sur «X» pour rechercher"` | `hotkeyTooltip?: string` — default `"Press ${hotkey} to search"` |
| Hardcoded French `aria-label` | Derived from `hotkeyTooltip` |
| Only `value`, `onChange`, `placeholder`, `debounceMs`, `hotkey`, `autoFocus`, `className` | Extends `Omit<React.ComponentProps<'input'>, 'onChange'>` — all native input props available |
| Icon fixed to `<Search />` | Still fixed — no icon prop (YAGNI) |

---

## File structure

```
packages/registry/items/components/search-input/
  component.tsx            The published component
  default.example.tsx      Controlled usage with debounce
  with-hotkey.example.tsx  Custom hotkey key + tooltip
  no-hotkey.example.tsx    hotkey={false} for simple filter lists
  index.mdx                Doc page
```

---

## Props API

```ts
export interface SearchInputProps extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  onChange: (value: string) => void;
  debounceMs?: number;       // default: 250
  hotkey?: string | false;   // default: '/'
  hotkeyTooltip?: string;    // default: `Press ${hotkey} to search`
}
```

Native props (`placeholder`, `value`, `autoFocus`, `className`, `disabled`, `name`, `aria-*`, `data-*`, etc.) flow through to the underlying `<Input>` via rest spread.

---

## Behavior

**Debounce:** `onChange(value: string)` fires after `debounceMs` ms of inactivity. Timer cleared on unmount. If `debounceMs <= 0`, fires immediately.

**Internal state:** `text` is local state initialized from `value` prop, kept in sync via `useEffect`. This allows usage both controlled (`value` + `onChange`) and uncontrolled (`onChange` only).

**Hotkey:** A `keydown` listener on `document` focuses the input when the matching key is pressed, unless the event target is already an editable element (`INPUT`, `TEXTAREA`, `SELECT`, `contenteditable`). Disabled when `hotkey={false}`.

**Hotkey badge:** Rendered only when `hotkey` is set, the input is empty, and the input is not focused. Clicking the badge focuses the input.

**Tooltip:** A `Popover` opens on mouse-enter of the badge. Content is `hotkeyTooltip`. The `aria-label` on the badge trigger also uses `hotkeyTooltip`.

**Icon:** `<Search />` from `lucide-react`, absolutely positioned left. The input has `pl-9` to accommodate it.

---

## Examples

### `default.example.tsx`
Controlled, debounced, no hotkey hint needed.
```tsx
'use client';
import { useState } from 'react';
import { SearchInput } from '@/components/ui/shuip/search-input';

export default function SearchInputExample() {
  const [query, setQuery] = useState('');
  return <SearchInput value={query} onChange={setQuery} placeholder="Search…" />;
}
```

### `with-hotkey.example.tsx`
Custom hotkey key and tooltip text.
```tsx
<SearchInput onChange={setQuery} hotkey="k" hotkeyTooltip="Press K to search" />
```

### `no-hotkey.example.tsx`
Hotkey fully disabled — clean filter input.
```tsx
<SearchInput onChange={setQuery} hotkey={false} placeholder="Filter items…" />
```

---

## Registry dependencies (auto-detected)

- `registryDependencies`: `input`, `popover`
- `dependencies`: `lucide-react`

---

## Out of scope

- Configurable icon prop — no current use case
- Headless hook (`useSearchInput`) — no current use case
- RHF/TSF variant — this is a UI primitive, not a form field
