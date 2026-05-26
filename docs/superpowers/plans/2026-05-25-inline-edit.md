# Inline Edit Implementation Plan

> **Status: implemented.** See the revised spec for the authoritative design. Verification is build-based (no test runner).

**Goal:** Ship click-to-edit value editing as two self-contained, form-bound registry items — `rhf-inline-edit` and `tsf-inline-edit` — with seamless (ghost) editing by default and a shared read↔edit typography scale.

**Architecture:** Each item's `component.tsx` inlines the full inline-edit cell (read→editing→saving→(error) state machine, plain class-map styling, text/textarea editors, render-prop escape hatch) and the form binding. No shared core — full duplication, traded for self-containment (matches `autocomplete-field`). On each commit the field is validated via the form, then an optional `onSave` persists it (save-now).

**Tech Stack:** React 19, TypeScript, Tailwind v4, shadcn `Input`/`Textarea`/`Field`/`Popover`, React Hook Form (`useController`/`useFormContext`/`trigger`) + `@hookform/lenses`, TanStack Form (`useFieldContext`), the shuip registry generator.

---

## File Structure

```
items/react-hook-form/inline-edit/
  component.tsx           inlined cell (InlineEdit, internal) + InlineEditField (exported, RHF).
                          Field binding: useController(lens.interop()) + useFormContext().trigger.
                          handleSave: field.onChange(next); if (await trigger(name)) await onSave?.(next).
                          error={fieldState.error?.message}. <Field orientation> + <FieldLabel> + info Popover.
  default.example.tsx     vertical label + description, save-now (no submit button)
  horizontal.example.tsx  orientation='horizontal'
  no-label.example.tsx    no label, boxed + textarea
  index.mdx               registryName 'rhf-inline-edit'

items/tanstack-form/inline-edit/
  component.tsx           inlined cell + InlineEditField (exported, TSF).
                          Binding: useFieldContext<string>(). handleSave: field.handleChange(next);
                          if (field.state.meta.isValid) await onSave?.(next). error from field.state.meta.
  default.example.tsx · horizontal.example.tsx · no-label.example.tsx
  index.mdx               registryName 'tsf-inline-edit'
```

The inlined cell is identical in both files: state machine, `error` prop (`internal ?? error`),
`commit(next?)` override for the escape hatch, plain `size`/`variant` class maps, no `Field`/label
(the exported `InlineEditField` adds those).

---

### Task 1: RHF item `rhf-inline-edit` — DONE
- [x] `component.tsx`: inlined cell + `InlineEditField` (lens + `trigger` save-now + `<Field>`/`<FieldLabel>` + description `<Popover>` via lucide `InfoIcon`, wrapped so it is not a direct `Field` child).
- [x] Examples: `default` (vertical), `horizontal`, `no-label` (boxed + textarea) — no submit button.
- [x] `index.mdx` (registryName `rhf-inline-edit`).

### Task 2: TSF item `tsf-inline-edit` — DONE
- [x] `component.tsx`: inlined cell + `InlineEditField` (`useFieldContext` + validate-then-save, error from `field.state.meta`).
- [x] Examples: `default`, `horizontal`, `no-label`. `index.mdx` (registryName `tsf-inline-edit`).

### Task 3: Remove the standalone core — DONE
- [x] Delete `items/components/inline-edit/`; remove the stale `content/docs/components/inline-edit.mdx` symlink left by the generator; `.gitignore` no longer lists it.

### Task 4: Build — DONE
- [x] `bun registry:generate` — no skip warnings; `inline-edit` absent.
- [x] `bun build:docs` — succeeds end-to-end (3/3 tasks).

### Task 5: Visual verification — PENDING (preview deploy)
- [ ] Confirm no-jump read↔edit, ghost vs boxed, `size='title'`, description popover, vertical / horizontal / no-label, and the form validation + save-now behaviour.

---

## Verification summary

- `registry.json`: `rhf-inline-edit` → `registryDependencies` `["field","input","popover","textarea"]`,
  `dependencies` `["@hookform/lenses","lucide-react","react","react-hook-form"]`;
  `tsf-inline-edit` → `registryDependencies` `["field","input","popover","textarea","tsf-form-context"]`,
  `dependencies` `["lucide-react","react"]`.
- Stubs at `stubs/react-hook-form/inline-edit.tsx`, `stubs/tanstack-form/inline-edit.tsx`; MDX symlinks
  under the two `content/docs/<cat>/`. No `components/inline-edit` artifacts remain.
- `bun build:docs` green.
