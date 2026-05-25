# Inline Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `InlineEdit` click-to-edit value cell to the shuip registry as a `components` item, with seamless (ghost) editing by default and a shared read↔edit typography scale.

**Architecture:** A single self-contained `component.tsx` holding an inlined read→editing→saving→(error) state machine, plain class-map styling (no cva, to keep zero npm deps), built-in `text`/`textarea` editors, and a render-prop escape hatch for custom editors. Verification is build-based per the shuip convention (no test runner): `bun registry:generate` + `bun build:docs` + a visual check in the docs dev server.

**Tech Stack:** React 19, TypeScript, Tailwind v4 (CSS-only), shadcn `Input`/`Textarea` primitives, the shuip registry generator.

---

## File Structure

- Create: `packages/registry/items/components/inline-edit/component.tsx` — the `InlineEdit` component (state machine + styling + editors). Single responsibility: the editable value cell.
- Create: `packages/registry/items/components/inline-edit/default.example.tsx` — ghost + text preview.
- Create: `packages/registry/items/components/inline-edit/boxed.example.tsx` — boxed + textarea preview.
- Create: `packages/registry/items/components/inline-edit/index.mdx` — doc page (examples + prop table).
- Regenerated (do not hand-edit): `packages/registry/registry.json`, `packages/registry/__index__.ts`, `packages/registry/stubs/inline-edit.tsx`, `apps/docs/content/docs/components/inline-edit.mdx` (symlink), `apps/docs/public/r/inline-edit.json`.

Branch `feat/inline-edit` already exists and the design spec is committed there.

---

### Task 1: InlineEdit component

**Files:**
- Create: `packages/registry/items/components/inline-edit/component.tsx`

- [ ] **Step 1: Write `component.tsx`**

```tsx
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type InlineEditSize = 'sm' | 'default' | 'title';
type InlineEditVariant = 'ghost' | 'boxed';
type InlineEditInput = 'text' | 'textarea';
type InlineEditTag = 'span' | 'p' | 'h1' | 'h2' | 'h3';

export interface InlineEditProps {
  value: string;
  onSave: (next: string) => Promise<void> | void;
  input?: InlineEditInput;
  variant?: InlineEditVariant;
  size?: InlineEditSize;
  as?: InlineEditTag;
  placeholder?: string;
  validate?: (next: string) => string | undefined;
  canEdit?: boolean;
  children?: (api: {
    value: string;
    setValue: (v: string) => void;
    commit: () => void;
    cancel: () => void;
    className: string;
    autoFocus: true;
  }) => React.ReactNode;
}

type State =
  | { kind: 'reading' }
  | { kind: 'editing'; draft: string; error?: string }
  | { kind: 'saving'; draft: string };

const sizeClasses: Record<InlineEditSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  default: 'px-2 py-1 text-sm',
  title: 'px-2 py-1 text-3xl font-semibold tracking-tight',
};

const variantClasses: Record<InlineEditVariant, string> = {
  ghost:
    'border border-transparent bg-transparent hover:bg-muted focus-visible:bg-muted dark:bg-transparent dark:hover:bg-muted',
  boxed: 'border border-input bg-transparent shadow-xs focus-visible:border-ring',
};

export function InlineEdit({
  value,
  onSave,
  input = 'text',
  variant = 'ghost',
  size = 'default',
  as: Tag = 'span',
  placeholder = '—',
  validate,
  canEdit = true,
  children,
}: InlineEditProps) {
  const [state, setState] = React.useState<State>({ kind: 'reading' });
  const errorId = React.useId();

  const fieldClassName = cn(
    'w-full rounded-md text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
    sizeClasses[size],
    variantClasses[variant],
  );

  const startEdit = () => {
    if (canEdit) setState({ kind: 'editing', draft: value });
  };

  const cancel = () => setState({ kind: 'reading' });

  const setDraft = (draft: string) =>
    setState((s) => (s.kind === 'editing' ? { kind: 'editing', draft } : s));

  const commit = async () => {
    if (state.kind !== 'editing') return;
    const { draft } = state;
    if (draft === value) {
      setState({ kind: 'reading' });
      return;
    }
    const validationError = validate?.(draft);
    if (validationError) {
      setState({ kind: 'editing', draft, error: validationError });
      return;
    }
    setState({ kind: 'saving', draft });
    try {
      await onSave(draft);
      setState({ kind: 'reading' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setState({ kind: 'editing', draft, error: message });
    }
  };

  if (state.kind === 'reading') {
    const isEmpty = value === '';
    return (
      <Tag
        data-slot='inline-edit'
        role={canEdit ? 'button' : undefined}
        tabIndex={canEdit ? 0 : undefined}
        onClick={canEdit ? startEdit : undefined}
        onKeyDown={
          canEdit
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  startEdit();
                }
              }
            : undefined
        }
        className={cn(
          fieldClassName,
          'block',
          canEdit ? 'cursor-text' : 'cursor-default',
          input === 'textarea' && 'whitespace-pre-wrap',
          isEmpty && 'text-muted-foreground',
        )}
      >
        {isEmpty ? placeholder : value}
      </Tag>
    );
  }

  const { draft } = state;
  const error = state.kind === 'editing' ? state.error : undefined;
  const isSaving = state.kind === 'saving';
  const editorClassName = cn(fieldClassName, 'h-auto min-w-0 shadow-none');

  const handleKeyDown: React.KeyboardEventHandler = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
    if (e.key === 'Enter' && input === 'text') {
      e.preventDefault();
      void commit();
    }
  };

  const editor = children ? (
    children({
      value: draft,
      setValue: setDraft,
      commit: () => void commit(),
      cancel,
      className: editorClassName,
      autoFocus: true,
    })
  ) : input === 'textarea' ? (
    <Textarea
      autoFocus
      value={draft}
      disabled={isSaving}
      aria-invalid={!!error}
      aria-describedby={error ? errorId : undefined}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={handleKeyDown}
      className={editorClassName}
    />
  ) : (
    <Input
      autoFocus
      type='text'
      value={draft}
      disabled={isSaving}
      aria-invalid={!!error}
      aria-describedby={error ? errorId : undefined}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={handleKeyDown}
      className={editorClassName}
    />
  );

  return (
    <div className='flex w-full flex-col gap-1'>
      <div className='flex items-center gap-2'>
        <div className='min-w-0 flex-1'>{editor}</div>
        {isSaving && <span aria-hidden className='size-1.5 shrink-0 animate-pulse rounded-full bg-primary/60' />}
      </div>
      {error && (
        <span id={errorId} className='text-xs text-destructive'>
          {error}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Generate and verify the item is picked up**

Run: `bun registry:generate`
Expected: console shows `[generate] N items processed` with N one higher than before, and **no** line `[generate] skipping components/inline-edit: no component.tsx`.

- [ ] **Step 3: Verify the generated registry entry and stub**

Run: `cat packages/registry/registry.json | grep -A 8 '"name": "inline-edit"'`
Expected: an entry `"name": "inline-edit"`, `"type": "registry:ui"`, `"registryDependencies": ["input", "textarea"]`, and **no** `dependencies` key.

Run: `ls packages/registry/stubs/inline-edit.tsx`
Expected: the stub file exists (re-export of the component).

- [ ] **Step 4: Commit**

```bash
git add packages/registry/items/components/inline-edit/component.tsx packages/registry/registry.json packages/registry/__index__.ts packages/registry/stubs/inline-edit.tsx
git commit -m "feat(inline-edit): add InlineEdit component"
```

---

### Task 2: Default example (ghost + text)

**Files:**
- Create: `packages/registry/items/components/inline-edit/default.example.tsx`

- [ ] **Step 1: Write `default.example.tsx`**

```tsx
'use client';

import * as React from 'react';
import { InlineEdit } from '@/components/ui/shuip/inline-edit';

export default function InlineEditExample() {
  const [name, setName] = React.useState('Acme Corporation');

  const handleSave = async (next: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setName(next);
  };

  return (
    <div className='w-full max-w-sm'>
      <InlineEdit value={name} onSave={handleSave} placeholder='Add a name' />
    </div>
  );
}
```

- [ ] **Step 2: Regenerate and verify the example is keyed**

Run: `bun registry:generate && grep "inline-edit.example" packages/registry/__index__.ts`
Expected: a match for the key `inline-edit.example`.

---

### Task 3: Boxed example (boxed + textarea)

**Files:**
- Create: `packages/registry/items/components/inline-edit/boxed.example.tsx`

- [ ] **Step 1: Write `boxed.example.tsx`**

```tsx
'use client';

import * as React from 'react';
import { InlineEdit } from '@/components/ui/shuip/inline-edit';

export default function InlineEditBoxedExample() {
  const [description, setDescription] = React.useState('Family-owned manufacturer since 1998.');

  const handleSave = async (next: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setDescription(next);
  };

  return (
    <div className='w-full max-w-sm'>
      <InlineEdit
        value={description}
        onSave={handleSave}
        input='textarea'
        variant='boxed'
        placeholder='Add a description'
      />
    </div>
  );
}
```

- [ ] **Step 2: Regenerate and verify the variant example is keyed**

Run: `bun registry:generate && grep "inline-edit.boxed.example" packages/registry/__index__.ts`
Expected: a match for the key `inline-edit.boxed.example`.

- [ ] **Step 3: Commit the examples**

```bash
git add packages/registry/items/components/inline-edit/default.example.tsx packages/registry/items/components/inline-edit/boxed.example.tsx packages/registry/registry.json packages/registry/__index__.ts
git commit -m "feat(inline-edit): add default and boxed examples"
```

---

### Task 4: Documentation page

**Files:**
- Create: `packages/registry/items/components/inline-edit/index.mdx`

- [ ] **Step 1: Write `index.mdx`**

````mdx
---
title: Inline Edit
description: A click-to-edit value that saves on commit.
registryName: inline-edit
---

import { TypeTable } from 'fumadocs-ui/components/type-table';

A value cell that displays text and turns into an editable input on click, saving on
commit (Enter, or blur) through an async `onSave`. Read and edit states share one
typography scale, so the value never jumps size — editing is seamless by default
(`variant='ghost'`). Use `variant='boxed'` for a thin bordered input, `size='title'`
for headings, and `as` to set the read-mode element for semantics.

## Examples

<ItemExamples registryName={'inline-edit'} />

## Props

<TypeTable
  type={{
    value: {
      description: 'The current value to display and edit.',
      type: 'string',
    },
    onSave: {
      description:
        'Called with the new value on commit. May return a promise; the cell shows a saving state while it is pending and an inline error if it rejects.',
      type: '(next: string) => Promise<void> | void',
    },
    input: {
      description: 'Which built-in editor to render in edit mode.',
      type: "'text' | 'textarea'",
      default: "'text'",
    },
    variant: {
      description: 'Edit-mode chrome. ghost is seamless (no border); boxed shows a thin bordered input.',
      type: "'ghost' | 'boxed'",
      default: "'ghost'",
    },
    size: {
      description: 'Typography and spacing scale, shared by the read and edit states.',
      type: "'sm' | 'default' | 'title'",
      default: "'default'",
    },
    as: {
      description: 'The element rendered in read mode, for semantics.',
      type: "'span' | 'p' | 'h1' | 'h2' | 'h3'",
      default: "'span'",
    },
    placeholder: {
      description: 'Shown when the value is empty, in read mode.',
      type: 'string',
    },
    validate: {
      description: 'Synchronous validation run before saving. Return a message to block the commit.',
      type: '(next: string) => string | undefined',
    },
    canEdit: {
      description: 'Whether clicking enters edit mode.',
      type: 'boolean',
      default: 'true',
    },
    children: {
      description:
        'Render-prop escape hatch for a custom editor. Receives value, setValue, commit, cancel, and the resolved className.',
      type: 'function',
    },
  }}
/>
````

- [ ] **Step 2: Regenerate and verify the doc symlink exists**

Run: `bun registry:generate && ls -l apps/docs/content/docs/components/inline-edit.mdx`
Expected: a symlink pointing at `../../../../../packages/registry/items/components/inline-edit/index.mdx` (path style matches the other components symlinks).

- [ ] **Step 3: Commit the doc**

```bash
git add packages/registry/items/components/inline-edit/index.mdx apps/docs/content/docs/components/inline-edit.mdx apps/docs/content/docs/components/.gitignore
git commit -m "docs(inline-edit): add documentation page"
```

---

### Task 5: End-to-end build

**Files:** none (build verification + generated `public/r`).

- [ ] **Step 1: Run the full docs build**

Run: `bun build:docs`
Expected: completes without error. It chains `registry:generate` → `registry:build` → `next build`. A TypeScript error in `component.tsx` or an example surfaces here.

- [ ] **Step 2: Verify the consumer JSON artifact**

Run: `cat apps/docs/public/r/inline-edit.json | grep -E '"name"|"registryDependencies"'`
Expected: `"name": "inline-edit"` and `"registryDependencies": ["input","textarea"]`.

- [ ] **Step 3: Commit the build output**

```bash
git add apps/docs/public/r/inline-edit.json
git commit -m "build(inline-edit): generate registry artifact"
```

---

### Task 6: Visual verification and polish

**Files:** possibly `packages/registry/items/components/inline-edit/component.tsx` (class adjustments only).

- [ ] **Step 1: Start the docs dev server**

Run: `bun dev:docs`
Then open the Inline Edit doc page (under the `components` section of the docs site).

- [ ] **Step 2: Verify the no-jump requirement**

Check each example by clicking the value to edit:
- The text does **not** change size or shift position between read and edit (this is the core requirement).
- Ghost (default example): no visible box at rest; subtle background/ring on focus only.
- Boxed (boxed example): thin border, input height aligned to the text (not the default `h-9`).
- Typing then clicking away (blur) saves; the saving dot appears briefly; the new value shows in read mode.
- Pressing `Escape` while editing reverts to the original value.
- For the textarea example, `Enter` inserts a newline and does not commit; blur commits.

- [ ] **Step 3: Adjust classes only if a jump or chrome issue is observed**

If read↔edit jumps, reconcile the conflicting Tailwind utility in `sizeClasses`/`variantClasses`/`editorClassName` (the shadcn `Input`/`Textarea` base classes — `h-9`, `border-input`, `px-3`, `text-base`, `shadow-xs` — are overridden via `tailwind-merge`; a jump means a missing override). Re-check in the browser.

- [ ] **Step 4: Commit any polish**

```bash
git add packages/registry/items/components/inline-edit/component.tsx
git commit -m "style(inline-edit): align read and edit typography"
```

(Skip this commit if Step 3 made no changes.)

---

## Self-Review

**Spec coverage:**
- Click-to-edit value cell, standalone `onSave` → Task 1 component. ✓
- State machine reading→editing→saving→(error), Enter/blur commit, Esc cancel, dirty-check, sync validate, async onSave, inline error → Task 1 component code. ✓
- Built-in `text` + `textarea` only; no select/date/currency/richtext/autocomplete; no layout variants; no `sonner` → Task 1 (only Input/Textarea, no toast). ✓
- `variant` ghost(default)/boxed, `size` sm/default/title shared read↔edit, `as` span(default)/p/h1/h2/h3, seamless default → Task 1 styling + Task 6 visual check. ✓
- Render-prop escape hatch receiving resolved className → Task 1 `children` branch. ✓
- Category `components`, folder `inline-edit`, stub `@/components/ui/shuip/inline-edit`, no `-field` suffix → file paths + Task 1 Step 3. ✓
- Files component.tsx + default.example + boxed.example + index.mdx → Tasks 1–4. ✓
- registryDependencies `[input, textarea]`, dependencies none → Task 1 Step 3, Task 5 Step 2. ✓
- Verification: generate (count +1, no skip), registry entry, stub, mdx symlink, build:docs → Tasks 1–5. ✓

**Deviation from spec, intentional:** the spec section is titled "Styling (cva)"; the plan uses plain class-map records instead of `cva` so the item ships with **zero** npm `dependencies` (importing `class-variance-authority` would add one). Behaviour is identical. Noted here so it is not mistaken for an omission.

**Placeholder scan:** no TBD/TODO; every code step contains complete code; every run step has an exact command and expected output. ✓

**Type consistency:** `InlineEditProps`, `State`, `sizeClasses`/`variantClasses` keys (`sm|default|title`, `ghost|boxed`), `commit`/`cancel`/`setDraft`/`startEdit` names, and the `children` api shape are defined once in Task 1 and referenced consistently by the examples (`value`/`onSave`/`input`/`variant`/`placeholder`) and the MDX prop table. ✓
