# Inline Edit — Design

**Date:** 2026-05-25
**Branch:** `feat/inline-edit`
**Status:** Approved

## Goal

Add a click-to-edit value cell to the shuip registry: a component that displays a
value, turns into an editable input on click, and saves on commit. It distills the
reusable essence of a bespoke `InlineEditField` built in the edik project (650 lines,
12 field types, 3 layout variants, Tiptap + debounced autocomplete in one file) down
to a small, focused, registry-quality item.

The defining requirement is a **coherent, proportional UI**: clicking the value must
not swap a light read label for a heavy boxed input. Read and edit states share one
typography/spacing scale, and editing is **seamless (ghost) by default**.

It is distinct from the `rhf-`/`tsf-` form fields: `InlineEdit` is standalone, saves a
single value immediately via an async `onSave` callback, and does not participate in a
form submit cycle.

## Item

One published item, in the `components` category (no prefix):

- `packages/registry/items/components/inline-edit/`

Component name `InlineEdit`. Stub import path `@/components/ui/shuip/inline-edit`.
No `-field` suffix — matches the existing `components` items (`copy-button`,
`hover-reveal`, `side-dialog`, `theme-button`).

## Scope (v1, YAGNI)

- Built-in editors: **text** and **textarea** only — the ~80% dashboard case (editing a
  name, title, short description).
- Anything else (select, date, currency, autocomplete, richtext) is handled through the
  render-prop escape hatch or deferred to a follow-up. None of it ships in v1.
- **Dropped from the edik original:** the `richtext` type (Tiptap, absent from shuip),
  `autocomplete` (custom `useDebounce`, absent from shuip), the `sonner` toast
  dependency, and the three layout variants (`inline`/`stacked`/`title`). Layout (where
  a label sits relative to the value) is the consumer's concern; `InlineEdit` renders
  only the editable value cell.

## Responsibility

A single editable value cell. It owns the read↔edit lifecycle and nothing else
(no label, no field layout). The consumer wraps it with their own label/grid.

### State machine (inlined from edik's reducer)

`reading → editing → saving → (error → editing)`

- Enter edit on click (or keyboard activation) when `canEdit` is true.
- Commit on **Enter** (`input: 'text'`) and on **blur** (both editors). For
  `input: 'textarea'`, Enter inserts a newline; commit is blur-only.
- **Esc** cancels and reverts to the original value.
- **Dirty-check**: if the draft equals the original, commit is a no-op cancel (no
  `onSave` call).
- `validate?(next)` runs synchronously before saving; a returned string blocks the
  commit and is shown inline.
- `onSave` may be sync or async. While a returned promise is pending the cell is in
  `saving` (subtle pending affordance, input disabled). A rejection moves to `error`
  with the value still in the editor and the message shown inline.

## API

```ts
interface InlineEditProps {
  value: string;
  onSave: (next: string) => Promise<void> | void;

  input?: 'text' | 'textarea';            // default 'text'
  variant?: 'ghost' | 'boxed';            // default 'ghost' (seamless)
  size?: 'sm' | 'default' | 'title';      // default 'default'
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3'; // default 'span' — read-mode element (semantics)

  placeholder?: string;                   // shown when value is empty, read mode
  validate?: (next: string) => string | undefined;
  canEdit?: boolean;                      // default true

  // Escape hatch for a custom editor (select, etc.). Receives the resolved
  // size+variant className so a custom editor stays visually coherent.
  children?: (api: {
    value: string;
    setValue: (v: string) => void;
    commit: () => void;
    cancel: () => void;
    className: string;
    autoFocus: true;
  }) => React.ReactNode;
}
```

## Styling (cva)

Two independent axes drive one shared look applied to **both** states, so read and edit
never jump in size:

- **`size`** sets the typography + box metrics (font-size, weight, line-height, padding).
  `sm` for table cells, `default` for detail rows, `title` for page headings
  (`title` carries the larger heading treatment the edik `title` variant did ad-hoc).
- **`variant`** sets the edit-mode chrome:
  - `ghost` (default): transparent background, no border, the value stays in place; a
    subtle focus affordance only (ring or bottom border) on focus.
  - `boxed`: a thin bordered input whose height aligns to the text (no `h-9`), discrete
    border.
- The resolved `size`+`variant` className is what gets passed to the render-prop editor,
  so a custom editor inherits the same coherence.

### Read element & accessibility

- The read display renders as the `as` tag (default `span`). The value text is the
  element's content, providing its accessible name.
- The read element is the click target to enter edit. When `as` is not a native button,
  apply `role="button"`, `tabIndex={0}`, and an Enter/Space `keydown` handler so it is
  keyboard-operable.
- When empty, the read display shows `placeholder` in a muted style.
- The edit input carries `aria-invalid` on error and `aria-describedby` pointing at the
  inline error node.

## Files

```
items/components/inline-edit/
  component.tsx          REQUIRED, exact name. ~110-140 lines, all inlined
                         (state machine + cva + text/textarea editors + escape hatch).
  default.example.tsx    ghost + text, e.g. editing a name (size 'default').
  boxed.example.tsx      boxed + textarea, e.g. editing a description.
  index.mdx              frontmatter (title, description, registryName: 'inline-edit'),
                         <ItemExamples registryName={'inline-edit'} />, and a
                         <TypeTable> for props (import TypeTable inline).
```

Examples import the component via the stub alias `@/components/ui/shuip/inline-edit`,
never relative `./component`.

## Dependencies (auto-detected by generate.ts)

- `registryDependencies`: `input`, `textarea` (via `@/components/ui/<name>` imports;
  both present in `packages/ui`).
- `dependencies`: none. Errors surface inline; no `sonner`/toast dependency.

## Verification

1. `bun registry:generate` — item count +1, no `skipping components/inline-edit: no
   component.tsx` warning.
2. New entry in `registry.json` with `registryDependencies: ["input", "textarea"]` and
   no `dependencies`.
3. Stub at `stubs/inline-edit.tsx`; MDX symlink under `content/docs/components/`.
4. `bun build:docs` succeeds end-to-end.

## Out of scope (YAGNI)

- Built-in `select` / `date` / `currency` / `autocomplete` / `richtext` editors.
- Layout variants (`inline` / `stacked` / `title` as edik did) and a built-in label.
- A `sonner` toast on save error (left to the consumer).
- Generic non-string `value` (v1 is `string`; the escape hatch can broaden later).
- Optimistic UI / retry-on-error beyond returning to the `editing` state.
- An RHF/TSF-integrated variant (inline edit saves immediately, outside a form cycle).
