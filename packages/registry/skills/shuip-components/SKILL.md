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
**components**
- `confirmation-dialog`
- `copy-button`
- `hover-reveal`
- `side-dialog`
- `submit-button`
- `theme-button`

**blocks**
- `kanban`
- `responsive-dialog`
- `title-section`

**react-hook-form**
- `rhf-address-field`
- `rhf-autocomplete-field`
- `rhf-checkbox-field`
- `rhf-date-field`
- `rhf-date-range-field`
- `rhf-datetime-field`
- `rhf-inline-edit`
- `rhf-input-field`
- `rhf-month-field`
- `rhf-number-field`
- `rhf-password-field`
- `rhf-radio-field`
- `rhf-select-field`
- `rhf-textarea-field`
- `rhf-time-field`
- `rhf-time-range`

**tanstack-form**
- `tsf-autocomplete-field`
- `tsf-checkbox-field`
- `tsf-date-field`
- `tsf-date-range-field`
- `tsf-datetime-field`
- `tsf-form-context`
- `tsf-inline-edit`
- `tsf-input-field`
- `tsf-month-field`
- `tsf-password-field`
- `tsf-radio-field`
- `tsf-select-field`
- `tsf-submit-button`
- `tsf-textarea-field`
- `tsf-time-field`
- `tsf-time-range`

**tanstack-query**
- `tsq-query-boundary`
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
