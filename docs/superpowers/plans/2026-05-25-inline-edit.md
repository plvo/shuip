# Inline Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. **Status: implemented** (see the revised spec for the authoritative design).

**Goal:** Ship click-to-edit value editing as three registry items — a standalone core plus two form-bound wrappers — with seamless (ghost) editing by default and a shared read↔edit typography scale.

**Architecture:** A lean core (`components/inline-edit`) owns the read→editing→saving→(error) state machine and seamless styling (plain class maps, no cva). Two thin wrappers (`rhf-inline-edit`, `tsf-inline-edit`) own the field chrome (`Field`/`FieldLabel`, description popover) and bind the core to a form: each commit validates the field via the form, then optionally persists via `onSave` (save-now). Wrappers import the core via its stub alias, so `generate.ts` auto-adds it to their `registryDependencies`. Verification is build-based (no test runner).

**Tech Stack:** React 19, TypeScript, Tailwind v4, shadcn `Input`/`Textarea`/`Field`/`Popover`, React Hook Form (`useController`/`useFormContext`/`trigger`) + `@hookform/lenses`, TanStack Form (`useFieldContext`), the shuip registry generator.

---

## File Structure

```
items/components/inline-edit/
  component.tsx          core InlineEdit: state machine + class-map styling + text/textarea editors
                         + render-prop escape hatch. Props: value, onSave, input, variant, size,
                         placeholder, validate, error, canEdit, children. Renders inline error
                         (internal ?? external `error`). No Field/label (kept lean). registryDeps: input, textarea.
  default.example.tsx    ghost + text, standalone immediate onSave
  boxed.example.tsx      boxed + textarea, standalone
  children.example.tsx   escape hatch: a shadcn Select as the custom editor (commit(next))
  index.mdx              registryName 'inline-edit'

items/react-hook-form/inline-edit/
  component.tsx          InlineEditField: useController(lens.interop()) + useFormContext().trigger.
                         onSave→ field.onChange(next); if (await trigger(name)) await onSave?.(next).
                         error={fieldState.error?.message}. Wraps core in <Field orientation> + info Popover.
  default.example.tsx    useForm + zodResolver + useLens + SubmitButton + per-field saveTitle
  index.mdx              registryName 'rhf-inline-edit'

items/tanstack-form/inline-edit/
  component.tsx          InlineEditField: useFieldContext<string>(). onSave→ field.handleChange(next);
                         if (field.state.meta.isValid) await onSave?.(next). error from field.state.meta.
  default.example.tsx    createFormHook + field validators.onChange + SubmitButton + saveTitle
  index.mdx              registryName 'tsf-inline-edit'
```

---

### Task 1: Core `InlineEdit` (lean) — DONE

- [x] Write `components/inline-edit/component.tsx` with the state machine, `error` prop (displayed as `internal ?? error`), `commit(next?)` override for the escape hatch, plain class maps for `size`/`variant`. No `Field`, no `as`.
- [x] `bun registry:generate` → `inline-edit` present, `registryDependencies: ["input","textarea"]`, no extra deps beyond `react`.

### Task 2: Core examples + doc — DONE

- [x] `default.example.tsx` (ghost+text), `boxed.example.tsx` (boxed+textarea), `children.example.tsx` (Select via `commit(next)`).
- [x] `index.mdx` — props table incl. `error`, no `as`; links to the rhf/tsf items.

### Task 3: RHF wrapper `rhf-inline-edit` — DONE

- [x] `react-hook-form/inline-edit/component.tsx` — bind via `useController(lens.interop())`, `trigger(field.name)` to validate one field, then `onSave?`. `<Field orientation>` + `<FieldLabel>` + description `<Popover>` (lucide `InfoIcon`, wrapped so it is not a direct `Field` child).
- [x] `default.example.tsx` (zodResolver + lens + SubmitButton), `index.mdx` (registryName `rhf-inline-edit`).
- [x] Verify `registryDependencies: ["field","inline-edit","popover"]`; deps `@hookform/lenses`, `react-hook-form`, `lucide-react`.

### Task 4: TSF wrapper `tsf-inline-edit` — DONE

- [x] `tanstack-form/inline-edit/component.tsx` — bind via `useFieldContext<string>()`, validate-then-save on commit, error from `field.state.meta`. Same chrome as RHF.
- [x] `default.example.tsx` (createFormHook + validators), `index.mdx` (registryName `tsf-inline-edit`).
- [x] Verify `registryDependencies: ["field","inline-edit","popover","tsf-form-context"]`; deps `@tanstack/react-form` (transitive via form-context), `lucide-react`.

### Task 5: Build — DONE

- [x] `bun registry:generate` — 38 items processed (+3), no skip warnings.
- [x] `bun build:docs` — succeeds end-to-end (3/3 tasks).

### Task 6: Visual verification — PENDING (preview deploy)

- [ ] On the PR preview, confirm the no-jump read↔edit, ghost vs boxed, `size='title'`, description popover, and the form examples (validation error + save-now) behave. Adjust class maps only if a jump/chrome issue appears.

---

## Verification summary

- `registry.json`: `inline-edit` → `["input","textarea"]`; `rhf-inline-edit` → `["field","inline-edit","popover"]`; `tsf-inline-edit` → `["field","inline-edit","popover","tsf-form-context"]`. Core auto-resolved as a dependency of both wrappers via `parseShuipDeps` — no `meta.shuip.json` needed.
- Stubs at `stubs/inline-edit.tsx`, `stubs/react-hook-form/inline-edit.tsx`, `stubs/tanstack-form/inline-edit.tsx`; MDX symlinks under the three `content/docs/<cat>/`.
- `bun build:docs` green.
