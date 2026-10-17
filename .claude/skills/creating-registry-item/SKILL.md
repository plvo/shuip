---
name: creating-registry-item
description: Use when adding a new shuip item (component, block, react-hook-form field, tanstack-form field, tanstack-query item) under packages/registry/items/, or when investigating why a newly added item is missing from registry.json or the docs site.
---

# Creating a Registry Item

## Overview

shuip items live at `packages/registry/items/<category>/<name>/`. `packages/registry/scripts/generate.ts` scans them and emits every artifact (registry.json, registry.base.json, __index__.ts, stubs, MDX symlinks, the Base UI copies under generated/base/, public/r/<variant>/*.json). Get the folder right, run the generator, the rest cascades. CLAUDE.md has the layout & path-mapping reference — this skill is the procedure.

**Categories & prefixes:** declared in the `CATEGORIES` map at the top of `packages/registry/scripts/generate.ts`. The categories are `components` · `blocks` (registry:block) · `react-hook-form` (prefix `rhf-`) · `tanstack-form` (prefix `tsf-`) · `tanstack-query` (prefix `tsq-`). The folder name is **unprefixed**; the script adds the prefix. Adding a new category = one entry in `CATEGORIES`.

## When to Use

- "Add a component / block / form field to shuip"
- "Publish X via the shadcn registry"
- "Create a new rhf-* / tsf-* / tsq-* item"
- A newly added item doesn't appear in `registry.json` or in the docs site
- Migrating an internal component from `packages/ui/` into a publishable item

## Procedure

### 1. Pick category and unprefixed name

Create `packages/registry/items/<category>/<name>/`. `<name>` has NO prefix — `rhf-` / `tsf-` is applied by the generator. Naming the folder `rhf-foo` publishes as `rhf-rhf-foo`.

### 2. Write `component.radix.tsx` (exact filename)

- Import shadcn primitives via `@/components/ui/<name>`. These become `registryDependencies` (the consumer's shadcn CLI will install them).
- Generally avoid importing `@/components/ui/shuip/*` from a `component.radix.tsx`. The one legitimate case is a **block or composite item that consumes another shuip item** — `blocks/responsive-dialog/component.radix.tsx` imports `@/components/ui/shuip/side-dialog` and ships a `meta.shuip.json` with `dependsOn: ["side-dialog"]`, which adds `side-dialog` to `registryDependencies` so the consumer's shadcn install resolves the import. Without that `dependsOn`, the dep is silently dropped (the regex in `parseRegistryDeps` excludes `shuip` paths). If you need a cross-item shuip dep: import via the stub alias AND declare it in `meta.shuip.json`.
- For RHF / TSF items, use the `register: UseFormRegisterReturn<FieldPath<T>>` prop signature as in `input-field/component.radix.tsx`. **The transferable pattern is the RHF integration (register prop + `FormField` + render-props plumbing), not the underlying primitive.** Which shadcn primitive you wrap is a separate decision driven by the task — `input-field`/`password-field` wrap `InputGroupInput` for addon slots; `address-field` wraps bare `Input`. If the task spec names a specific primitive, follow the spec.
- **Derive props from the primitive** you forward them to (`React.ComponentProps<typeof Button>`, `extends React.ComponentProps<typeof Input>`) and declare only what the item adds. A re-declared copy of the primitive's props matches one base and drifts on the other, while a derived type follows whichever primitive `@/components/ui/<name>` resolves to.
- Add `'use client'` at the top only when the component uses client-only React features (state, refs, effects, browser APIs). Half the existing RHF components have it for that reason; the other half (purely presentational wrappers over `FormField`) correctly do not. Don't cargo-cult it.
- **Schemas / types may be exported** when the item describes a domain shape — see `address-field/component.radix.tsx` which exports `addressSchema` and `AddressData`. For format-only validation (E.164, URL, etc.), exporting a regex or zod schema next to the component is fine; consumers can opt in.

### 3. Write `default.example.radix.tsx`

- Import the new component via the stub alias (see table below). Never via relative `./component.radix` — the example must exercise the same path consumers will use after `shadcn add`.
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

Beyond the default, add `<variant>.example.radix.tsx` showing a meaningful alternate use (e.g. `email.example.radix.tsx`, `validation.example.radix.tsx`, `tooltip.example.radix.tsx`). This keeps documentation richer than a single canonical preview and proves the component is flexible. Variants are keyed as `<prefixed-name>.<variant>.example`. Look at `input-field/` for the multi-example pattern.

### 4b. Check the Base UI variant

`component.radix.tsx` and `<variant>.example.radix.tsx` are the canonical sources; the Base UI variant is generated from them by a codemod (`asChild` becomes `render`). Run `bun registry:generate` and read its warnings: an `asChild` the codemod cannot convert, or a link rendered with `nativeButton={false}`, is reported with the file and line.

**Write an override only where the two APIs genuinely diverge** (a Radix-only prop such as `onOpenAutoFocus`, `PopoverAnchor`). If the codemod output is correct, add nothing: an override is a second file to keep in step. To write one, follow "Adding a Base UI override" in CLAUDE.md: copy the canonical file, change only what diverges, run `bun typecheck:base`. When `registry:generate` later warns that an override predates its canonical file, update the override, or commit it unchanged once you have checked it still holds.

### 5. Write `index.mdx` — but only for components / RHF / TSF / TSQ

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

**Base-specific prose:** the same MDX renders on the Base UI and the Radix page of the item. Prose or a snippet that only holds for one base (an `asChild` composition, a Radix-only prop) goes inside `<BaseOnly base="radix">…</BaseOnly>`, with the Base UI counterpart in `<BaseOnly base="base">…</BaseOnly>`; leave a blank line after the opening tag and before the closing one (see `side-dialog/index.mdx`). `apps/docs/scripts/base-prose.test.ts` fails when a Radix-only API appears outside a Radix block. Do not write `<BaseOnly>` without its `base` attribute: the same test counts blocks and rejects it.

**Blocks are different:** do NOT put `index.mdx` in `items/blocks/<name>/`. Block docs are real MDX files in `apps/docs/content/blocks/<name>.mdx` (a separate fumadocs collection). Putting `index.mdx` in a block's item folder makes the generator create a dead symlink under `content/components/blocks/` that no collection reads — the page silently doesn't appear.

### 6. Optional: extras and meta

- `extras/<file>.action.ts` → installed at `./actions/shuip/<file>.ts` on the consumer side.
- `extras/<file>.<ext>` → installed at `./components/ui/shuip/<file>.<ext>`.
- `meta.shuip.json` with `{ "dependsOn": ["<other-shuip-item>"] }` for cross-item registry deps that the import scanner cannot detect. It also takes the authored registry fields `title`, `description`, `author`, `categories`, `docs`, `meta`, `cssVars`, `css` and `envVars`; the generator merges them into both registries and fails on `name`, `type`, `dependencies`, `registryDependencies`, `files` or `target`.
- If an extras file is referenced from `component.radix.tsx` via a new alias not already mapped (the only precedent is `@/actions/shuip/places`), add the path mapping to `apps/docs/tsconfig.json`, `packages/registry/tsconfig.json` and `packages/registry/items/tsconfig.json` (a test checks the last against the second). Forgetting one breaks IDE resolution or the docs build.

### 7. Run the generator and verify

```bash
bun registry:generate
```

Confirm in the output:
- `[generate] N items processed` with N incremented by 1
- No `[generate] skipping <cat>/<name>: no component.radix.tsx` warning for your item (that warning means the filename is wrong and the item is invisible)

Then sanity-check the produced artifacts:
- New entry in `packages/registry/registry.json` (correct prefixed name, expected `registryDependencies` and `dependencies`)
- Stub at `packages/registry/stubs/<cat-subdir>/<name>.tsx` (for blocks: `packages/registry/stubs/blocks/<name>.tsx`)
- Symlink at `apps/docs/content/components/<name>.mdx` for `components` items, or `apps/docs/content/components/<cat>/<name>.mdx` for the other categories (blocks have none)
- Base UI copy at `packages/registry/generated/base/items/<cat>/<name>/`

### 8. End-to-end build

```bash
bun build:docs
```

This chains `registry:generate` → `registry:build` (`apps/docs/public/r/<variant>/*.json`, one folder per base) → `next build`. If it succeeds, the item is installable.

### 9. Smoke-test both bases

`bun smoke` installs items through the `@shuip` namespace into a fresh shadcn project and type-checks them. Run it once per base for the item you touched:

```bash
bun smoke radix-vega --items <prefixed-name>
bun smoke base-vega --items <prefixed-name>
```

A `base-*` style is served the Base UI variant, and the run fails on any Radix package. Drop `--items` to install every item before a larger change.

## Generated Artifacts — Don't Edit

`registry.json`, `registry.base.json`, `__index__.ts`, `stubs/**`, `generated/**`, `apps/docs/public/r/<variant>/**`, the MDX symlinks under `apps/docs/content/components/` and the `.gitignore` files listing them are all regenerated. Edits are clobbered. Always edit the source under `items/`. `registry.json` and `registry.base.json` are the two committed ones: commit them regenerated with the item, because CI fails when they drift from `bun registry:generate`.

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Folder prefixed (`rhf-foo`) | Item published as `rhf-rhf-foo` | Drop the prefix; generator adds it |
| `component.radix.tsx` missing or misnamed | `[generate] skipping ...` warning; item invisible | Filename must be exactly `component.radix.tsx` |
| Example imports `./component.radix` | Preview works locally; the actual install path is unverified | Use `@/components/ui/shuip/<cat-subdir>/<name>` |
| `component.radix.tsx` imports `@/components/ui/shuip/*` without a matching `meta.shuip.json` `dependsOn` | Dep silently dropped from `registryDependencies`; consumer install missing the referenced item | Either declare the dep in `meta.shuip.json` (legitimate composite-item case, see `responsive-dialog`), or import shadcn primitives via `@/components/ui/<name>` instead |
| Block has `index.mdx` in its item folder | Symlink lands in `content/components/blocks/`, fumadocs doesn't read it, page absent | Move the MDX to `apps/docs/content/blocks/<name>.mdx`; remove the symlink |
| Edits write to the MDX symlink in `content/components/` | Edit succeeds (writes through the symlink) but the source-of-truth confusion is real | Edit `items/<cat>/<name>/index.mdx` |
| Skipping `registry:generate` after adding files | New item never appears | Always run it; `bun build:docs` chains it for you |
| `bun add` for a shared dep | Catalog drift between workspaces | Add via the root `workspaces.catalog` (or sub-catalog), reference as `"catalog:"` |
| Aliased extras with a mapping missing from one of the three tsconfigs | IDE or build breaks | Mirror in `apps/docs/tsconfig.json`, `packages/registry/tsconfig.json` and `packages/registry/items/tsconfig.json` |
| Re-declaring a primitive's props by hand (`asChild?: boolean`, `onClick`, `disabled`, …) | Matches one base only; the other base's primitive disagrees | Extend `React.ComponentProps<typeof X>` and declare only the props the item adds |
| Writing a `component.base.tsx` the codemod would have produced | A second file that drifts from the canonical one | Delete it, run `registry:generate`, and keep an override only for real API divergence |
| Radix-only prose (`asChild`, `onOpenAutoFocus`) outside `<BaseOnly base="radix">` | `base-prose.test.ts` fails, and the Base UI page documents an API it lacks | Wrap it in a Radix block and add the Base UI counterpart |
| Skipping the variant example | Doc page shows only one preview, looks thin | Add at least one `<variant>.example.radix.tsx` showing an alternate prop usage |

## Red Flags — STOP

- About to write to `stubs/`, `__index__.ts`, `registry.json`, `registry.base.json`, `generated/`, `apps/docs/public/r/`, or a `content/components/` symlink
- Folder name starts with `rhf-`, `tsf-`, or `tsq-`
- An `.example.radix.tsx` has `from './component.radix'` (relative)
- A `component.radix.tsx` has `from '@/components/ui/shuip/` without a matching `meta.shuip.json` `dependsOn`
- Putting an `index.mdx` in `items/blocks/<name>/`
- `[generate] N items processed` with N unchanged after you added the item
- Adding a path mapping in fewer than the three tsconfigs
- A `component.base.tsx` with no API divergence from `component.radix.tsx`
- An override committed without running `bun typecheck:base`
- Shipping an item after smoke-testing only one base
