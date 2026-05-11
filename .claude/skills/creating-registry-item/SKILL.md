---
name: creating-registry-item
description: Use when adding a new shuip item (component, block, react-hook-form field, tanstack-form field) under packages/registry/items/, or when investigating why a newly added item is missing from registry.json or the docs site.
---

# Creating a Registry Item

## Overview

shuip items live at `packages/registry/items/<category>/<name>/`. `packages/registry/scripts/generate.ts` scans them and emits every artifact (registry.json, __index__.ts, stubs, MDX symlinks, public/r/*.json). Get the folder right, run the generator, the rest cascades. CLAUDE.md has the layout & path-mapping reference — this skill is the procedure.

**Categories & prefixes:** declared in the `CATEGORIES` map at the top of `packages/registry/scripts/generate.ts`. Currently: `components` · `blocks` (registry:block) · `react-hook-form` (prefix `rhf-`) · `tanstack-form` (prefix `tsf-`) · `tanstack-query` (prefix `tsq-`). The folder name is **unprefixed**; the script adds the prefix. Adding a new category = one entry in `CATEGORIES`.

## When to Use

- "Add a component / block / form field to shuip"
- "Publish X via the shadcn registry"
- "Create a new rhf-* / tsf-* / tsq-* item"
- A newly added item doesn't appear in `registry.json` or in the docs site
- Migrating an internal component from `packages/ui/` into a publishable item

## Procedure

### 1. Pick category and unprefixed name

Create `packages/registry/items/<category>/<name>/`. `<name>` has NO prefix — `rhf-` / `tsf-` is applied by the generator. Naming the folder `rhf-foo` publishes as `rhf-rhf-foo`.

### 2. Write `component.tsx` (exact filename)

- Import shadcn primitives via `@/components/ui/<name>`. These become `registryDependencies` (the consumer's shadcn CLI will install them).
- Generally avoid importing `@/components/ui/shuip/*` from a `component.tsx`. The one legitimate case is a **block or composite item that consumes another shuip item** — `blocks/responsive-dialog/component.tsx` imports `@/components/ui/shuip/side-dialog` and ships a `meta.shuip.json` with `dependsOn: ["side-dialog"]`, which adds `side-dialog` to `registryDependencies` so the consumer's shadcn install resolves the import. Without that `dependsOn`, the dep is silently dropped (the regex in `parseRegistryDeps` excludes `shuip` paths). If you need a cross-item shuip dep: import via the stub alias AND declare it in `meta.shuip.json`.
- For RHF / TSF items, use the `register: UseFormRegisterReturn<FieldPath<T>>` prop signature as in `input-field/component.tsx`. **The transferable pattern is the RHF integration (register prop + `FormField` + render-props plumbing), not the underlying primitive.** Which shadcn primitive you wrap is a separate decision driven by the task — `input-field`/`password-field` wrap `InputGroupInput` for addon slots; `address-field` wraps bare `Input`. If the task spec names a specific primitive, follow the spec.
- Add `'use client'` at the top only when the component uses client-only React features (state, refs, effects, browser APIs). Half the existing RHF components have it for that reason; the other half (purely presentational wrappers over `FormField`) correctly do not. Don't cargo-cult it.
- **Schemas / types may be exported** when the item describes a domain shape — see `address-field/component.tsx` which exports `addressSchema` and `AddressData`. For format-only validation (E.164, URL, etc.), exporting a regex or zod schema next to the component is fine; consumers can opt in.

### 3. Write `default.example.tsx`

- Import the new component via the stub alias (see table below). Never via relative `./component` — the example must exercise the same path consumers will use after `shadcn add`.
- The default example is keyed as `<prefixed-name>.example` in `__index__.ts`.

**Stub alias per category:**

| Category | Stub import path |
|----------|------------------|
| `components` | `@/components/ui/shuip/<name>` |
| `react-hook-form` | `@/components/ui/shuip/react-hook-form/<name>` |
| `tanstack-form` | `@/components/ui/shuip/tanstack-form/<name>` |
| `tanstack-query` | `@/components/ui/shuip/tanstack-query/<name>` |
| `blocks` | `@/components/block/shuip/<name>` *(different prefix: `block`, not `ui`)* |

### 4. Add at least one variant example

Beyond the default, add `<variant>.example.tsx` showing a meaningful alternate use (e.g. `email.example.tsx`, `validation.example.tsx`, `tooltip.example.tsx`). This keeps documentation richer than a single canonical preview and proves the component is flexible. Variants are keyed as `<prefixed-name>.<variant>.example`. Look at `input-field/` for the multi-example pattern.

### 5. Write `index.mdx` — but only for components / RHF / TSF

Frontmatter must include `title`, `description`, and `registryName: <prefixed-name>`. Body uses `<ItemExamples registryName={'<prefixed-name>'} />` to render the previews and `<TypeTable>` for props.

`ItemExamples` and `ItemHeader` are globally registered MDX components (defined in `apps/docs/src/mdx-components.tsx`) — no import line needed. `TypeTable` is from fumadocs-ui and **must be imported inline in the MDX**.

Minimal skeleton:

```mdx
---
title: <Display Name>
description: <One-line description for SEO + docs sidebar>
registryName: <prefixed-name>
---

<Prose explaining what this item does and when to use it.>

import { TypeTable } from 'fumadocs-ui/components/type-table';

## Examples

<ItemExamples registryName={'<prefixed-name>'} />

## Props

<TypeTable
  type={{
    propName: {
      description: '...',
      type: 'string?',
    },
  }}
/>
```

Model on a sibling item's `index.mdx` for prose style and prop documentation patterns.

**Blocks are different:** do NOT put `index.mdx` in `items/blocks/<name>/`. Block docs are real MDX files in `apps/docs/content/blocks/<name>.mdx` (a separate fumadocs collection). Putting `index.mdx` in a block's item folder makes the generator create a dead symlink under `content/docs/blocks/` that no collection reads — the page silently doesn't appear.

### 6. Optional: extras and meta

- `extras/<file>.action.ts` → installed at `./actions/shuip/<file>.ts` on the consumer side.
- `extras/<file>.<ext>` → installed at `./components/ui/shuip/<file>.<ext>`.
- `meta.shuip.json` with `{ "dependsOn": ["<other-shuip-item>"] }` for cross-item registry deps that the import scanner cannot detect.
- If an extras file is referenced from `component.tsx` via a new alias not already mapped (the only precedent is `@/actions/shuip/places`), add the path mapping to **both** `apps/docs/tsconfig.json` and `packages/registry/tsconfig.json`. Forgetting either breaks IDE resolution or the docs build.

### 7. Run the generator and verify

```bash
bun registry:generate
```

Confirm in the output:
- `[generate] N items processed` with N incremented by 1
- No `[generate] skipping <cat>/<name>: no component.tsx` warning for your item (that warning means the filename is wrong and the item is invisible)

Then sanity-check the produced artifacts:
- New entry in `packages/registry/registry.json` (correct prefixed name, expected `registryDependencies` and `dependencies`)
- Stub at `packages/registry/stubs/<cat-subdir>/<name>.tsx` (for blocks: `packages/registry/stubs/blocks/<name>.tsx`)
- Symlink at `apps/docs/content/docs/<cat>/<name>.mdx` (only for components / RHF / TSF — blocks won't have one)

### 8. End-to-end build

```bash
bun build:docs
```

This chains `registry:generate` → `registry:build` (apps/docs/public/r/*.json) → `next build`. If it succeeds, the item is installable.

## Generated Artifacts — Don't Edit

`registry.json`, `__index__.ts`, `stubs/**`, `apps/docs/public/r/**`, `apps/docs/content/docs/<cat>/<name>.mdx` (symlinks), and `apps/docs/content/docs/<cat>/.gitignore` are all regenerated. Edits are clobbered. Always edit the source under `items/`.

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Folder prefixed (`rhf-foo`) | Item published as `rhf-rhf-foo` | Drop the prefix; generator adds it |
| `component.tsx` missing or misnamed | `[generate] skipping ...` warning; item invisible | Filename must be exactly `component.tsx` |
| Example imports `./component` | Preview works locally; the actual install path is unverified | Use `@/components/ui/shuip/<cat-subdir>/<name>` |
| `component.tsx` imports `@/components/ui/shuip/*` without a matching `meta.shuip.json` `dependsOn` | Dep silently dropped from `registryDependencies`; consumer install missing the referenced item | Either declare the dep in `meta.shuip.json` (legitimate composite-item case, see `responsive-dialog`), or import shadcn primitives via `@/components/ui/<name>` instead |
| Block has `index.mdx` in its item folder | Symlink lands in `content/docs/blocks/`, fumadocs doesn't read it, page absent | Move the MDX to `apps/docs/content/blocks/<name>.mdx`; remove the symlink |
| Edits write to the MDX symlink in `content/docs/` | Edit succeeds (writes through the symlink) but the source-of-truth confusion is real | Edit `items/<cat>/<name>/index.mdx` |
| Skipping `registry:generate` after adding files | New item never appears | Always run it; `bun build:docs` chains it for you |
| `bun add` for a shared dep | Catalog drift between workspaces | Add via the root `workspaces.catalog` (or sub-catalog), reference as `"catalog:"` |
| Aliased extras with mapping in only one tsconfig | IDE or build breaks | Mirror in both `apps/docs/tsconfig.json` and `packages/registry/tsconfig.json` |
| Skipping the variant example | Doc page shows only one preview, looks thin | Add at least one `<variant>.example.tsx` showing an alternate prop usage |

## Red Flags — STOP

- About to write to `stubs/`, `__index__.ts`, `registry.json`, `apps/docs/public/r/`, or a `content/docs/<cat>/<name>.mdx` symlink
- Folder name starts with `rhf-`, `tsf-`, or `tsq-`
- An `.example.tsx` has `from './component'` (relative)
- A `component.tsx` has `from '@/components/ui/shuip/` without a matching `meta.shuip.json` `dependsOn`
- Putting an `index.mdx` in `items/blocks/<name>/`
- `[generate] N items processed` with N unchanged after you added the item
- Adding a path mapping in only one tsconfig
