---
name: shuip-overview
description: Use when working in a project that uses shuip and you need to know what shuip provides, how to install items from its registry, or which shuip skill/category to reach for. Triggers on shuip imports (@/components/ui/shuip/...) or a shuip registry URL (shuip.plvo.dev/r/...).
---

# shuip

## What it is

shuip is a component library built on shadcn/ui for Next.js + React. You install individual **items** through the shadcn CLI from shuip's registry; the source is copied into the project (same model as shadcn) and you own it afterwards.

## Install any item

```bash
npx shadcn@latest add "https://shuip.plvo.dev/r/<item-name>"
```

Items install under `@/components/ui/shuip/...` (or `@/components/block/shuip/...` for blocks) and pull their shadcn primitives and npm dependencies automatically. **Exported symbols are unprefixed** — the item `rhf-input-field` exports `InputField`; the `rhf-`/`tsf-`/`tsq-` prefix is only the registry name.

## Categories

- **components** — standalone UI: dialogs, buttons, theme toggle (e.g. `side-dialog`, `confirmation-dialog`, `copy-button`, `theme-button`).
- **blocks** — composed multi-part UI (e.g. `kanban`, `responsive-dialog`, `title-section`).
- **react-hook-form** (`rhf-`) — form fields wired to react-hook-form via typed lenses.
- **tanstack-form** (`tsf-`) — form fields wired to tanstack-form via context.
- **tanstack-query** (`tsq-`) — data-fetching helpers (e.g. `query-boundary`).

## Which skill next

- Building or editing a **form** → use the **shuip-forms** skill (rhf/tsf field patterns in depth).
- Choosing or composing **components/blocks**, or you need the full item catalog → use the **shuip-components** skill.

Before building UI from scratch, check whether shuip already ships it.
