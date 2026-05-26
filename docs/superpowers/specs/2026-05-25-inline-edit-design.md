# Inline Edit — Design

**Date:** 2026-05-25
**Branch:** `feat/inline-edit`
**Status:** Approved (revised — 3-item architecture, form-bound wrappers)

## Goal

Add click-to-edit value editing to the shuip registry: a value displays as text and
turns into an editable input on click, saving on commit. Distilled from a bespoke
650-line `InlineEditField` (12 field types + 3 layout variants + Tiptap + autocomplete
in one file) down to a focused core plus two thin form-bound wrappers.

The defining UI requirement is a **coherent, proportional read↔edit transition**: clicking
the value must not swap a light label for a heavy boxed input. Read and edit share one
typography scale; editing is **seamless (ghost) by default**.

## Three items (shared core + two form-bound wrappers)

| Item | Published name | Role |
|---|---|---|
| `components/inline-edit` | `inline-edit` | The lean, standalone editable cell. `value` + `onSave` (immediate save). |
| `react-hook-form/inline-edit` | `rhf-inline-edit` | Wraps the core; binds to React Hook Form; validates one field then saves now. |
| `tanstack-form/inline-edit` | `tsf-inline-edit` | Wraps the core; binds to TanStack Form; validates one field then saves now. |

**Division of responsibility (the key decision):** the core owns the *interaction*
(read↔edit↔saving lifecycle + styling). The wrappers own the *field chrome* (label,
description, error display) and the *form binding* — because the validation error comes
from the form controller, the `Field`/`FieldLabel` chrome belongs where that error lives,
not in the core. Putting `Field` in the core would duplicate what the wrappers do.

**Why a shared core (not full duplication):** the standalone cell is a useful product on
its own (immediate per-field save on a detail page), and the wrappers genuinely depend on
it. The wrappers import it via the stub alias `@/components/ui/shuip/inline-edit`, which
`generate.ts` auto-adds to their `registryDependencies` (`parseShuipDeps`), so
`shadcn add rhf-inline-edit` pulls the core automatically. No `meta.shuip.json` needed.

## Core — `components/inline-edit`

### Responsibility
A single editable value cell. Read↔edit↔saving lifecycle, seamless styling, minimal inline
error. No label, no `Field`, no description — the consumer (or a wrapper) supplies those.

### State machine
`reading → editing → saving → (error → editing)`
- Enter edit on click / keyboard activation when `canEdit`.
- Commit on **Enter** (`input: 'text'`) and **blur** (both). For `textarea`, Enter inserts
  a newline; commit is blur-only. **Esc** cancels, reverting to the original value.
- **Dirty-check**: draft equal to original → no-op cancel, no `onSave`.
- `validate?(next)` runs synchronously before saving (standalone use); a returned string
  blocks the commit.
- `onSave` may be sync or async. A pending promise → `saving` (subtle dot, input disabled).
  A rejection → `error` with the message shown inline and the draft preserved.

### API
```ts
interface InlineEditProps {
  value: string;
  onSave: (next: string) => Promise<void> | void;
  input?: 'text' | 'textarea';        // default 'text'
  variant?: 'ghost' | 'boxed';        // default 'ghost' (seamless)
  size?: 'sm' | 'default' | 'title';  // default 'default'
  placeholder?: string;               // shown when empty, read mode
  validate?: (next: string) => string | undefined; // internal validation (standalone)
  error?: string;                     // external error (a wrapper passes the form's error)
  canEdit?: boolean;                  // default true
  children?: (api: {                  // escape hatch for a custom editor (e.g. Select)
    value: string;
    setValue: (v: string) => void;
    commit: () => void;
    cancel: () => void;
    className: string;                // resolved size+variant class, for visual coherence
    autoFocus: true;
  }) => React.ReactNode;
}
```
- **Displayed error** = internal error (validate / onSave rejection) `??` `error` prop. One
  inline `<p>` (`text-destructive text-xs`), `aria-invalid` + `aria-describedby` wired. No
  `Field`/`FieldError` (keeps the core dep-light).
- **`as` prop removed** (was unused).

### Styling (plain class maps, no cva → zero npm deps)
- `size` → shared typography + box metrics applied to **both** read and edit (no jump).
- `variant` → edit chrome: `ghost` (transparent, no border, subtle focus ring) /
  `boxed` (thin border, height aligned to text, no `h-9`).
- The resolved class is passed to the render-prop editor so custom editors stay coherent.

### Dependencies
- `registryDependencies`: `input`, `textarea`.
- `dependencies`: none.

## Wrappers — `rhf-inline-edit` / `tsf-inline-edit`

Both render the same chrome around the core and differ only in form binding:

```tsx
<Field orientation={orientation} className='gap-2' data-invalid={invalid}>
  {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
  <div className='flex items-center gap-2'>            {/* not a direct Field child → icon stays inline */}
    <InlineEdit value={value} error={formError} onSave={handleSave} {...{ input, variant, size, placeholder, canEdit }} />
    {description && <InfoPopover>{description}</InfoPopover>}  {/* Popover via lucide InfoIcon, right side */}
  </div>
</Field>
```
- `<Field>` gets `className='gap-2'` (overrides its default `gap-3`); the info icon is wrapped
  in the inner `div`, not a direct child of `Field` (avoids `[&>*]:w-full` stretching it).

### Save-now mechanics (validate via the form, then persist)
- **RHF** — `const { field, fieldState } = useController(lens.interop())`,
  `const { trigger, getFieldState, formState } = useFormContext()`. On core commit:
  ```ts
  field.onChange(next);
  if (!(await trigger(field.name))) throw new Error(getFieldState(field.name, formState).error?.message ?? 'Invalid');
  await onSave?.(next);     // persistence (save-now); omit onSave for submit-only usage
  ```
  Throwing makes the core stay in `editing` and show the message. `error={fieldState.error?.message}`
  also keeps the error visible in read mode.
- **TSF** — `const field = useFieldContext<string>()`. On core commit:
  ```ts
  field.handleChange(next);
  await field.validate('change');
  if (!field.state.meta.isValid) throw new Error(firstErrorMessage(field.state.meta.errors));
  await onSave?.(next);
  ```
  `error` is derived from `field.state.meta` (errors may be `string` or `{ message }` —
  normalise like the existing tsf `input-field`).

### Wrapper props
```ts
// RHF
interface InlineEditFieldProps extends Pick<InlineEditProps, 'input'|'variant'|'size'|'placeholder'|'canEdit'> {
  lens: Lens<string>;
  onSave?: (next: string) => Promise<void> | void;   // optional: present = save-now; absent = submit-only
  label?: string;
  description?: string;
  orientation?: 'vertical' | 'horizontal';            // default 'vertical', forwarded to <Field>
}
// TSF — same, minus `lens` (uses useFieldContext); same prop names otherwise.
```

### Dependencies
- RHF — `registryDependencies`: `field`, `inline-edit`, `popover`. `dependencies`:
  `@hookform/lenses`, `react-hook-form`, `lucide-react`.
- TSF — `registryDependencies`: `field`, `inline-edit`, `popover`, `tsf-form-context`.
  `dependencies`: `@tanstack/react-form`, `lucide-react`.

## Files

```
items/components/inline-edit/
  component.tsx            core InlineEdit (~140 lines)
  default.example.tsx      ghost + text, standalone immediate onSave
  boxed.example.tsx        boxed + textarea, standalone
  children.example.tsx     escape hatch: a Select as the custom editor
  index.mdx                registryName 'inline-edit'

items/react-hook-form/inline-edit/
  component.tsx            InlineEditField (RHF wrapper)
  default.example.tsx      useForm + lens + zodResolver + SubmitButton + onSave (save-now)
  index.mdx                registryName 'rhf-inline-edit'

items/tanstack-form/inline-edit/
  component.tsx            InlineEditField (TSF wrapper)
  default.example.tsx      createFormHook + validators + save-now
  index.mdx                registryName 'tsf-inline-edit'
```

Examples import via stub aliases (`@/components/ui/shuip/inline-edit`,
`@/components/ui/shuip/react-hook-form/inline-edit`,
`@/components/ui/shuip/tanstack-form/inline-edit`), never relative.

## Verification (build-based, no test runner)

1. `bun registry:generate` — item count +3, no `skipping … no component.tsx` warnings.
2. `registry.json`: `inline-edit` → `["input","textarea"]`; `rhf-inline-edit` →
   `["field","inline-edit","popover"]`; `tsf-inline-edit` →
   `["field","inline-edit","popover","tsf-form-context"]` (sorted).
3. Stubs at `stubs/inline-edit.tsx`, `stubs/react-hook-form/inline-edit.tsx`,
   `stubs/tanstack-form/inline-edit.tsx`; MDX symlinks under the three `content/docs/<cat>/`.
4. `bun build:docs` succeeds end-to-end.

## Out of scope (YAGNI)

- Built-in `select`/`date`/`currency`/`richtext`/`autocomplete` editors (escape hatch covers custom).
- A built-in label/description on the **core** (lives in the wrappers).
- `sonner` toast on save error (core surfaces it inline; consumer may add toasts).
- Generic non-string `value` (v1 is `string`).
- Optimistic UI / retry beyond returning to `editing`.
