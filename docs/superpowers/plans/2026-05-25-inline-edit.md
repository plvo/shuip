# Inline Edit Implementation Plan

> **Status: implemented (revised 2026-05-26).** See the revised spec for the authoritative
> design. Verification is build-based (no test runner).

**Goal:** Ship click-to-edit value editing as two self-contained, form-bound registry items —
`rhf-inline-edit` and `tsf-inline-edit` — with seamless (ghost) editing by default and a shared
read↔edit typography scale. **Persistence is the form's job, not the field's.**

**Architecture:** Each item's `component.tsx` inlines the full inline-edit cell (read→editing→
saving→(editing with error) state machine, plain class-map styling, text/textarea editors,
render-prop escape hatch) and the form binding. No shared core — full duplication, traded for
self-containment (matches `autocomplete-field`). On commit the field updates + validates the
value via the form; persistence is wired once at the form level (RHF `form.watch`, TSF
`onSubmit`), so one handler covers every field — there is no per-field `onSave`.

**Tech Stack:** React 19, TypeScript, Tailwind v4, shadcn `Input`/`Textarea`/`Field`/`Popover`
(+ `Select` in one example), React Hook Form (`useController`/`useFormContext`/`trigger`/
`getFieldState`) + `@hookform/lenses`, TanStack Form (`useFieldContext`, `field.form.handleSubmit`),
the shuip registry generator.

---

## File Structure

```
items/react-hook-form/inline-edit/
  component.tsx              inlined cell + InlineEditField (RHF).
                             Cell: onCommit(next) => error message | undefined.
                             Wrapper handleCommit: field.onChange(next); await trigger(name);
                             return getFieldState(name, formState).error?.message on failure.
                             Horizontal: label flex-none + value flex-1 (fixes the "between" gap).
  default.example.tsx        title + owner; localStorage autosave via a single form.watch + readout
  sizes.example.tsx          sm / default / title
  variants.example.tsx       ghost vs boxed
  horizontal.example.tsx     orientation='horizontal'
  no-label.example.tsx       no label, boxed + textarea, empty → placeholder
  custom-editor.example.tsx  children escape hatch with a Select
  index.mdx                  registryName 'rhf-inline-edit'

items/tanstack-form/inline-edit/
  component.tsx              inlined cell + InlineEditField (TSF).
                             Wrapper handleCommit: field.handleChange(next); gate on
                             field.state.meta.isValid; else await field.form.handleSubmit().
  default/sizes/variants/horizontal/no-label/custom-editor.example.tsx  (default persists via onSubmit)
  index.mdx                  registryName 'tsf-inline-edit'
```

The inlined cell is identical in both files: state machine, `onCommit` contract,
`commit(next?)` override for the escape hatch, plain `size`/`variant` class maps, no `Field`/label
(the exported `InlineEditField` adds those).

---

### Task 1: RHF item `rhf-inline-edit` — DONE
- [x] `component.tsx`: inlined cell (`onCommit`) + `InlineEditField` (lens + `trigger`/`getFieldState`,
      `<Field>`/`<FieldLabel>` + description `<Popover>`; horizontal label/value fix).
- [x] Examples: `default` (watch persistence + readout), `sizes`, `variants`, `horizontal`,
      `no-label`, `custom-editor` (Select).
- [x] `index.mdx`: prose describes form-level persistence; `onSave` removed from props.

### Task 2: TSF item `tsf-inline-edit` — DONE
- [x] `component.tsx`: identical cell + `InlineEditField` (`useFieldContext`, validity gate +
      `field.form.handleSubmit()`; same horizontal fix).
- [x] Same six examples (`default` persists via `onSubmit`). `index.mdx` updated.

### Task 3: Build & type-check — DONE
- [x] `bun registry:generate` — 37 items; `rhf-inline-edit`/`tsf-inline-edit` deps unchanged.
- [x] `bun build:docs` — succeeds end-to-end (3/3 tasks).
- [x] `tsc --noEmit -p packages/registry` — no errors (only the pre-existing `baseUrl` deprecation).

### Task 4: Visual verification — PENDING (preview deploy)
- [ ] no-jump read↔edit, ghost/boxed, sizes, horizontal label hugs text (no "between"),
      description popover, Select escape hatch, and persistence survives reload.

---

## Verification summary

- `registry.json`: `rhf-inline-edit` → `registryDependencies` `["field","input","popover","textarea"]`,
  `dependencies` `["@hookform/lenses","lucide-react","react","react-hook-form"]`;
  `tsf-inline-edit` → `registryDependencies` `["field","input","popover","textarea","tsf-form-context"]`,
  `dependencies` `["lucide-react","react"]`. Example-only imports (`select`, `zod`, resolvers) are
  not scanned, so they stay out of the published deps.
- `bun build:docs` green; registry type-check clean.
