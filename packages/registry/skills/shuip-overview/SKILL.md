---
name: shuip-overview
description: Use when working in a project that uses shuip and you need to know what shuip provides, how to install items from its registry, or which shuip skill/category to reach for. Triggers on shuip imports (@/components/ui/shuip/...) or a shuip registry reference (@shuip/<name>).
---

# shuip

## What it is

shuip is a component library built on shadcn/ui for Next.js + React. You install individual **items** through the shadcn CLI from shuip's registry; the source is copied into the project (same model as shadcn) and you own it afterwards.

## Install any item

Declare the namespace once in the project's `components.json`:

```json
{ "registries": { "@shuip": "https://shuip.plvo.dev/r/{style}/{name}.json" } }
```

Then install by name:

```bash
npx shadcn@latest add @shuip/<item-name>
```

Items install under `@/components/ui/shuip/...` (or `@/components/block/shuip/...` for blocks) and pull their shadcn primitives and npm dependencies automatically. **Exported symbols are unprefixed** — the item `rhf-input-field` exports `InputField`; the `rhf-`/`tsf-`/`tsq-` prefix is only the registry name.

## Base UI or Radix

The project's `components.json` `style` decides which variant of an item installs; the install command is the same for both.

| `style` | Variant |
|---------|---------|
| `base-*` (for example `base-vega`) | Base UI |
| `radix-*`, `new-york`, `new-york-v4`, `default` | Radix |
| `aria-*` | Not supported: the registry answers 404 |

Read the `style` before writing any trigger or slot, and compose accordingly:

- In `base-*` projects, compose with `render`: `<DialogTrigger render={<Button />}>Open</DialogTrigger>`. Add `nativeButton={false}` when the rendered element is not a button, except for a link: Base UI discourages `nativeButton={false}` on one, so style a plain anchor with `buttonVariants` instead.
- In Radix projects, compose with `asChild`: `<DialogTrigger asChild><Button /></DialogTrigger>`.

Never mix the two in one project.

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
