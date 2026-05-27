---
name: shuip-components
description: Use when choosing which shuip item fits a need, or composing shuip components and blocks — provides the full item catalog, install/import conventions, and composition notes. Use before building UI that shuip may already provide.
---

# Choosing & composing shuip components

## Conventions

- Install: `npx shadcn@latest add "https://shuip.plvo.dev/r/<item-name>"`.
- Import paths by category:
  - components → `@/components/ui/shuip/<name>`
  - blocks → `@/components/block/shuip/<name>`
  - react-hook-form → `@/components/ui/shuip/react-hook-form/<name>`
  - tanstack-form → `@/components/ui/shuip/tanstack-form/<name>`
  - tanstack-query → `@/components/ui/shuip/tanstack-query/<name>`
- **Exports are unprefixed**: `rhf-input-field` → `InputField`, `kanban` → `Kanban`.
- For anything form-related, use the **shuip-forms** skill — it covers the rhf/tsf field patterns in depth.

## Catalog

<!-- shuip:catalog:start -->
**components** (import `@/components/ui/shuip/<name>`)
- `confirmation-dialog` — modal to confirm a destructive action
- `copy-button` — button that copies text to the clipboard with feedback
- `hover-reveal` — reveal content on hover
- `side-dialog` — sheet/drawer-style dialog anchored to a screen edge
- `submit-button` — submit button with explicit `loading` state (used by react-hook-form forms)
- `theme-button` — light/dark theme toggle

**blocks** (import `@/components/block/shuip/<name>`)
- `kanban` — drag-and-drop kanban board
- `responsive-dialog` — dialog on desktop, drawer on mobile (composes `side-dialog`)
- `title-section` — page/section heading layout

**react-hook-form** — `rhf-` items, lens-bound fields (see shuip-forms)
- `input-field`, `password-field`, `number-field`, `textarea-field`, `select-field`, `checkbox-field`, `radio-field`, `autocomplete-field`, `date-field`, `date-range-field`, `datetime-field`, `month-field`, `time-field`, `time-range`, `inline-edit`, `address-field` (with Places autocomplete)

**tanstack-form** — `tsf-` items, context-bound fields (see shuip-forms)
- `form-context` (required foundation), `input-field`, `password-field`, `number-field`, `textarea-field`, `select-field`, `checkbox-field`, `radio-field`, `autocomplete-field`, `date-field`, `date-range-field`, `datetime-field`, `month-field`, `time-field`, `time-range`, `inline-edit`, `submit-button` (auto-disables via `form.Subscribe`)

**tanstack-query** (import `@/components/ui/shuip/tanstack-query/<name>`)
- `query-boundary` — wrap a subtree to handle TanStack Query loading/error states
<!-- shuip:catalog:end -->

## Composition notes

- `responsive-dialog` composes `side-dialog`; installing it resolves the dependency.
- `confirmation-dialog` for destructive-action confirmation; `side-dialog` for sheet-style panels.
- `query-boundary` wraps data-fetching subtrees so you don't hand-roll loading/error UI.
- Form fields are never used alone — they compose inside a form. Use **shuip-forms**.

## Common mistakes

| Mistake | Reality |
|---------|---------|
| Building a dialog / kanban / clipboard button from scratch | Check the catalog first — shuip likely ships it. |
| Importing a prefixed symbol (`RhfInputField`, `TsfInputField`) | Exports are unprefixed (`InputField`). |
| Flat path `@/components/ui/shuip/rhf-input-field` | Form categories use a sub-folder: `@/components/ui/shuip/react-hook-form/input-field`. |
| Treating blocks as `@/components/ui/shuip/...` | Blocks import from `@/components/block/shuip/<name>`. |
