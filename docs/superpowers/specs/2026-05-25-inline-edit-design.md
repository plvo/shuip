# Inline Edit — Design

**Date:** 2026-05-25
**Branch:** `feat/inline-edit`
**Status:** Approved (revised — two self-contained form-bound items)

## Goal

Add click-to-edit value editing to the shuip registry as two form-bound fields. A value
displays as text and turns into an editable input on click, saving on commit. Distilled
from a bespoke 650-line `InlineEditField` (12 field types + 3 layout variants + Tiptap +
autocomplete in one file).

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
DRY is explicitly traded away for self-containment (the user's call).

## The inlined cell (identical in both items)

A `InlineEdit` function defined inside each `component.tsx` (not exported). It owns the
*interaction*; the exported `InlineEditField` wraps it with the form binding and chrome.

### State machine
`reading → editing → saving → (error → editing)`
- Enter edit on click / keyboard activation when `canEdit`.
- Commit on **Enter** (`input: 'text'`) and **blur** (both). For `textarea`, Enter inserts a
  newline; commit is blur-only. **Esc** cancels, reverting to the original value.
- **Dirty-check**: draft equal to original → no-op cancel, no `onSave`.
- `validate?(next)` runs synchronously before saving; a returned string blocks the commit.
- `onSave` may be sync or async. Pending promise → `saving` (subtle dot, input disabled).
  Rejection → `error` with the message shown inline, draft preserved.

### Cell props (internal)
```ts
interface InlineEditProps {
  value: string;
  onSave: (next: string) => Promise<void> | void;
  input?: 'text' | 'textarea';        // default 'text'
  variant?: 'ghost' | 'boxed';        // default 'ghost' (seamless)
  size?: 'sm' | 'default' | 'title';  // default 'default'
  placeholder?: string;
  validate?: (next: string) => string | undefined;
  error?: string;                     // external error (the wrapper passes the form's error)
  canEdit?: boolean;                  // default true
  children?: (api: {                  // escape hatch for a custom editor (e.g. Select)
    value: string; setValue: (v: string) => void;
    commit: (next?: string) => void;  // optional override → usable for Select onValueChange
    cancel: () => void; className: string; autoFocus: true;
  }) => React.ReactNode;
}
```
- Displayed error = internal (validate / onSave rejection) `??` `error` prop. One inline `<p>`,
  `aria-invalid` + `aria-describedby` wired.
- Styling: plain class maps (no cva). `size` → shared typography for read+edit (no jump);
  `variant` → edit chrome (`ghost` seamless / `boxed` thin border). Resolved class passed to
  the render-prop editor.

## The exported field — `InlineEditField`

```tsx
<Field orientation={orientation} className='gap-2' data-invalid={invalid}>
  {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
  <div className='flex items-center gap-2'>           {/* not a direct Field child → icon stays inline */}
    <InlineEdit {...display} value={value} error={formError} onSave={handleSave} />
    {description && <InfoPopover>{description}</InfoPopover>}  {/* Popover behind a lucide InfoIcon */}
  </div>
</Field>
```
- `<Field className='gap-2'>` overrides Field's default `gap-3`; the info icon is wrapped in the
  inner `div`, not a direct `Field` child (avoids `[&>*]:w-full` stretching it).
- **No submit button in the examples** — save-now persists each field on commit, so a form
  submit button would be redundant and misleading.

### Save-now (validate via the form, then persist)
- **RHF** — `useController(lens.interop())` + `useFormContext().trigger`. On commit:
  `field.onChange(next); if (await trigger(field.name)) await onSave?.(next)`. `error` from
  `fieldState.error?.message`.
- **TSF** — `useFieldContext<string>()`. On commit:
  `field.handleChange(next); if (field.state.meta.isValid) await onSave?.(next)`. `error`
  normalised from `field.state.meta.errors` (string or `{ message }`).
- `onSave` is **optional**: present → save-now; omit → the value still updates the form
  (submit-only usage).

### Field props
```ts
// RHF
interface InlineEditFieldProps
  extends Pick<InlineEditProps, 'input'|'variant'|'size'|'placeholder'|'canEdit'|'children'> {
  lens: Lens<string>;
  onSave?: (next: string) => Promise<void> | void;
  label?: string;
  description?: string;
  orientation?: 'vertical' | 'horizontal';   // default 'vertical', forwarded to <Field>
}
// TSF — identical minus `lens` (binds via useFieldContext).
```

## Files

```
items/react-hook-form/inline-edit/
  component.tsx           inlined cell + InlineEditField (RHF)
  default.example.tsx     vertical label + description, save-now (no submit button)
  horizontal.example.tsx  orientation='horizontal'
  no-label.example.tsx    no label, boxed + textarea
  index.mdx               registryName 'rhf-inline-edit'

items/tanstack-form/inline-edit/   (same example set)
  component.tsx           inlined cell + InlineEditField (TSF)
  default.example.tsx · horizontal.example.tsx · no-label.example.tsx
  index.mdx               registryName 'tsf-inline-edit'
```

Examples import via the stub aliases (`@/components/ui/shuip/react-hook-form/inline-edit`,
`@/components/ui/shuip/tanstack-form/inline-edit`), never relative.

## Dependencies (auto-detected)

- `rhf-inline-edit` — `registryDependencies`: `field`, `input`, `popover`, `textarea`.
  `dependencies`: `@hookform/lenses`, `lucide-react`, `react`, `react-hook-form`.
- `tsf-inline-edit` — `registryDependencies`: `field`, `input`, `popover`, `textarea`,
  `tsf-form-context`. `dependencies`: `lucide-react`, `react`.

## Verification (build-based, no test runner)

1. `bun registry:generate` — no `skipping … no component.tsx` warnings; the deleted
   `components/inline-edit` no longer present; its stale symlink removed from `content/docs/components/`.
2. `registry.json` deps as above (sorted).
3. `bun build:docs` succeeds end-to-end.
4. Preview: no-jump read↔edit, ghost/boxed, `size='title'`, description popover, vertical /
   horizontal / no-label layouts, and the form validation + save-now behaviour.

## Out of scope (YAGNI)

- A standalone non-form `inline-edit` item (removed; the form-bound items are the product).
- Built-in `select`/`date`/`currency`/`richtext`/`autocomplete` editors (escape hatch covers custom).
- `sonner` toast on save error (surfaced inline; consumer may add toasts).
- Generic non-string `value`.
