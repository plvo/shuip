# Inline Edit — Design

**Date:** 2026-05-25 (revised 2026-05-26)
**Branch:** `feat/inline-edit`
**Status:** Approved — two self-contained form-bound items; persistence lives in the form

## Goal

Add click-to-edit value editing to the shuip registry as two form-bound fields. A value
displays as text and turns into an editable input on click, committing on Enter/blur.
Distilled from a bespoke 650-line `InlineEditField` (12 field types + 3 layout variants +
Tiptap + autocomplete in one file).

The defining UI requirement is a **coherent, proportional read↔edit transition**: clicking
the value must not swap a light label for a heavy boxed input. Read and edit share one
typography scale; editing is **seamless (ghost) by default**.

## Two items (self-contained, full duplication)

| Item | Published name | Form lib |
|---|---|---|
| `react-hook-form/inline-edit` | `rhf-inline-edit` | React Hook Form |
| `tanstack-form/inline-edit` | `tsf-inline-edit` | TanStack Form |

Each item's `component.tsx` is **self-contained**: it inlines the full inline-edit cell
(state machine + styling + editors) *and* the form binding. No shared `components/inline-edit`
item — **full duplication is deliberate**, matching the `autocomplete-field` precedent:
`shadcn add rhf-inline-edit` installs one complete, working file with no extra item to pull.

## The inlined cell (identical in both items)

A `InlineEdit` function defined inside each `component.tsx` (not exported). It owns the
*interaction*; the exported `InlineEditField` wraps it with the form binding and chrome.

### State machine
`reading → editing → saving → (editing with error)`
- Enter edit on click / keyboard activation when `canEdit`.
- Commit on **Enter** (`input: 'text'`) and **blur** (both). For `textarea`, Enter inserts a
  newline; commit is blur-only. **Esc** cancels, reverting to the original value.
- **Dirty-check**: draft equal to original → no-op cancel, no commit.
- On commit the cell awaits `onCommit(draft)` (shown as `saving` — subtle dot, input disabled).
  A returned message → back to `editing` with the error inline; `undefined` → `reading`.

### Cell props (internal)
```ts
interface InlineEditProps {
  value: string;
  onCommit: (next: string) => Promise<string | undefined> | string | undefined;
  input?: 'text' | 'textarea';        // default 'text'
  variant?: 'ghost' | 'boxed';        // default 'ghost' (seamless)
  size?: 'sm' | 'default' | 'title';  // default 'default'
  placeholder?: string;
  canEdit?: boolean;                  // default true
  children?: (api: {                  // escape hatch for a custom editor (e.g. Select)
    value: string; setValue: (v: string) => void;
    commit: (next?: string) => void;  // override → usable for Select onValueChange
    cancel: () => void; className: string; autoFocus: true;
  }) => React.ReactNode;
}
```
- `onCommit` returns an error message to keep the cell in `editing` (inline `<p>`,
  `aria-invalid` + `aria-describedby` wired), or `undefined` to return to `reading`. It carries
  validation *and* (for TSF) the submit; there is no separate `validate`/`error`/`onSave` prop.
- Styling: plain class maps (no cva). `size` → shared typography for read+edit (no jump);
  `variant` → edit chrome (`ghost` seamless / `boxed` thin border). Resolved class passed to
  the render-prop editor.

## The exported field — `InlineEditField`

```tsx
<Field
  orientation={orientation}
  data-invalid={invalid}
  className={cn('gap-2', orientation === 'horizontal' && '[&>[data-slot=field-label]]:flex-none')}
>
  {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
  <div className={cn('flex items-center gap-2', orientation === 'horizontal' && 'flex-1')}>
    <InlineEdit {...display} value={value} onCommit={handleCommit} />
    {description && <InfoPopover>{description}</InfoPopover>}  {/* Popover behind a lucide InfoIcon */}
  </div>
</Field>
```
- `<Field className='gap-2'>` overrides Field's default `gap-3`; the info icon lives in the inner
  `div`, not a direct `Field` child (avoids `[&>*]:w-full` stretching it).
- **Horizontal fix:** Field's horizontal variant gives the label `flex-auto` — it grows and pushes
  the value to the right edge (a "between" look). The wrapper overrides it to `flex-none` and gives
  the value `flex-1`, so the label hugs its text and the value fills the remaining width.
- **No submit button, no per-field `onSave`** — the field only updates + validates the value.

### Commit → validate → persist (the form owns persistence)
- **RHF** — `useController(lens.interop())` + `useFormContext()`. `handleCommit(next)`:
  `field.onChange(next); if (await trigger(field.name)) return undefined;` else return
  `getFieldState(field.name, formState).error?.message`. Persistence: a single `form.watch`
  subscription writes the whole form to `localStorage`.
- **TSF** — `useFieldContext<string>()`. `handleCommit(next)`: `field.handleChange(next)`; if
  `!field.state.meta.isValid` return the first error; else `await field.form.handleSubmit()` so
  the form's `onSubmit` persists, with the saving dot showing while it runs.
- No per-field callback: **one handler at the form level** (`watch` / `onSubmit`) covers every
  field, instead of N `onSave` functions.

### Field props
```ts
// RHF
interface InlineEditFieldProps
  extends Pick<InlineEditProps, 'input'|'variant'|'size'|'placeholder'|'canEdit'|'children'> {
  lens: Lens<string>;
  label?: string;
  description?: string;
  orientation?: 'vertical' | 'horizontal';   // default 'vertical', forwarded to <Field>
}
// TSF — identical minus `lens` (binds via useFieldContext).
```

## Files

```
items/react-hook-form/inline-edit/
  component.tsx              inlined cell + InlineEditField (RHF)
  default.example.tsx        title + owner; localStorage autosave via form.watch + readout
  sizes.example.tsx          sm / default / title
  variants.example.tsx       ghost vs boxed
  horizontal.example.tsx     orientation='horizontal'
  no-label.example.tsx       no label, boxed + textarea, empty → placeholder
  custom-editor.example.tsx  children escape hatch with a Select
  index.mdx                  registryName 'rhf-inline-edit'

items/tanstack-form/inline-edit/   (same example set; default persists via onSubmit)
  component.tsx + default/sizes/variants/horizontal/no-label/custom-editor.example.tsx
  index.mdx                  registryName 'tsf-inline-edit'
```

Examples import via the stub aliases (`@/components/ui/shuip/react-hook-form/inline-edit`,
`@/components/ui/shuip/tanstack-form/inline-edit`), never relative.

## Dependencies (auto-detected)

- `rhf-inline-edit` — `registryDependencies`: `field`, `input`, `popover`, `textarea`.
  `dependencies`: `@hookform/lenses`, `lucide-react`, `react`, `react-hook-form`.
- `tsf-inline-edit` — `registryDependencies`: `field`, `input`, `popover`, `textarea`,
  `tsf-form-context`. `dependencies`: `lucide-react`, `react`.

Example-only imports (`select`, `zod`, `@hookform/resolvers`) are **not** scanned, so they do
not enter the published item's dependencies.

## Verification (build-based, no test runner)

1. `bun registry:generate` — no `skipping … no component.tsx` warnings; deps as above.
2. `bun build:docs` succeeds end-to-end (3/3 tasks).
3. `tsc --noEmit -p packages/registry` clean (only the pre-existing `baseUrl` deprecation).
4. Preview: no-jump read↔edit, ghost/boxed, sizes, horizontal label hugs its text (no "between"),
   description popover, Select escape hatch, and persistence — edit a field, watch the readout
   update, reload, value survives.

## Out of scope (YAGNI)

- A standalone non-form `inline-edit` item (removed; the form-bound items are the product).
- A per-field `onSave` callback (persistence is the form's job: `watch` / `onSubmit`).
- Built-in `select`/`date`/`currency`/`richtext` editors (escape hatch covers custom).
- Generic non-string `value`.
