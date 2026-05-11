---
name: auditing-registry-consistency
description: Use when auditing the shuip registry for accumulated drift, silent failures, or convention violations — before a release, after a refactor or merge, when a newly added item doesn't appear in the build, or when a consumer reports `shadcn add` fetching incomplete files.
---

# Auditing Registry Consistency

## Overview

The shuip registry has many implicit conventions (folder layout, import paths, per-category doc flow, catalog pinning) that the generator enforces only loosely. Several failure modes are silent — items skipped without errors, dead symlinks fumadocs doesn't read, path mappings that work in IDE but not at build, deps silently dropped from `registryDependencies`. This skill is a systematic audit pass that catches them.

CLAUDE.md has the layout reference; the `creating-registry-item` skill has the procedure for creating items. This one catches drift in what already exists.

**Do not auto-fix during the audit.** Surface findings grouped by severity, let the human triage. Auto-fixing conflates discovery with remediation and may erase context the human needs.

## When to Use

- Before tagging a release
- After a merge that touched the registry, the generator, or path mappings
- When a new item silently fails to appear in `registry.json` or on the docs site
- When a consumer reports a broken install (`shadcn add` fetches incomplete files)
- After bulk renames, category moves, or workspace restructures
- Periodic hygiene pass

## Procedure

Run each check, capture findings, report at the end. Don't fix mid-audit — the act of running `bun registry:generate` mid-pass cleans up some inconsistencies before you've recorded them.

### 1. Items missing `component.tsx` — silent skip

Generator logs `[generate] skipping <cat>/<name>: no component.tsx` and the item never reaches `registry.json`. Catches wrong-case (`Component.tsx`), missing file, or stub-only folders.

```bash
find packages/registry/items -mindepth 2 -maxdepth 2 -type d \
  ! -exec test -e {}/component.tsx \; -print
```

### 2. Blocks with stray `index.mdx` — wrong fumadocs collection

Block items should not contain `index.mdx`. Their docs are hand-written in `apps/docs/content/blocks/<name>.mdx` (separate fumadocs collection). A stray `index.mdx` makes the generator symlink to `apps/docs/content/docs/blocks/`, which then shows as a duplicate page under `/docs/blocks/<name>` while the canonical `/blocks/<name>` keeps the real version.

```bash
ls packages/registry/items/blocks/*/index.mdx 2>/dev/null
```

### 3. `component.tsx` importing shuip stubs without `dependsOn`

`parseRegistryDeps` excludes `@/components/ui/shuip/*` from auto-detected `registryDependencies`. A `component.tsx` that imports another shuip item is fine **only if** `meta.shuip.json` declares `dependsOn: ["<other-item>"]`. Without it, the dep is silently missing and the consumer install breaks.

```bash
# List components.tsx files importing shuip stubs
grep -rln "from '@/components/ui/shuip/" packages/registry/items/*/*/component.tsx

# For each match, verify a meta.shuip.json with dependsOn exists in the SAME folder.
# `responsive-dialog` is the canonical legitimate example.
```

### 4. Examples with relative `./component` imports

Examples must import via the stub alias (`@/components/ui/shuip/<cat-subdir>/<name>`) so the preview exercises the same path consumers will use after `shadcn add`. Relative imports compile locally but never test the install path.

```bash
grep -rn "from '\./component'" packages/registry/items/
```

### 5. Folder names with `rhf-` / `tsf-` / `tsq-` prefix

The generator adds the prefix from the `CATEGORIES` map (`packages/registry/scripts/generate.ts`). Manual prefixing produces `rhf-rhf-foo`.

```bash
ls packages/registry/items/react-hook-form/ | grep '^rhf-' || echo OK
ls packages/registry/items/tanstack-form/ | grep '^tsf-' || echo OK
ls packages/registry/items/tanstack-query/ | grep '^tsq-' || echo OK
```

### 6. tsconfig path-mapping hygiene

Two checks. (a) Mappings present in `packages/registry/tsconfig.json` but missing from `apps/docs/tsconfig.json` (or vice versa) break either IDE resolution or the docs build. (b) Mapping targets pointing to files that no longer exist.

```bash
# (a) Drift between the two tsconfigs (ignore the docs-only @/* and fumadocs-mdx aliases)
diff <(jq -r '.compilerOptions.paths | keys[]' apps/docs/tsconfig.json | sort) \
     <(jq -r '.compilerOptions.paths | keys[]' packages/registry/tsconfig.json | sort)

# (b) Targets that don't exist (run from packages/registry/)
cd packages/registry && \
  jq -r '.compilerOptions.paths | to_entries[] | "\(.key)\t\(.value[0])"' tsconfig.json | \
  while IFS=$'\t' read -r alias target; do
    [ -e "${target%/\*}" ] || echo "stale: $alias -> $target"
  done
```

### 7. Broken / stale symlinks in `apps/docs/content/docs/`

After a rename or category move, the old symlink isn't auto-removed. Symlink targets that no longer exist cause fumadocs to render an empty doc or a build failure depending on collection wiring.

```bash
find apps/docs/content/docs -type l ! -exec test -e {} \; -print
```

### 8. `'use client'` missing where required

Components using `useState`/`useEffect`/`useRef`/`useCallback`/`useMemo`/any `use<X>` hook (including `useTheme`, `useFormContext`) must declare `'use client'` or they break in Server Component contexts (the App Router default). This check needs manual triage — many client hooks come from Radix transitively where the directive isn't needed.

```bash
for f in $(find packages/registry/items -name component.tsx); do
  if grep -q "useState\|useEffect\|useRef\|useCallback\|useMemo\|useTheme\|useFormContext" "$f"; then
    head -1 "$f" | grep -q "'use client'" || echo "missing 'use client': $f"
  fi
done
```

### 9. Item completeness

For each item: should have `default.example.tsx`, should have at least one variant example, and should have `index.mdx` (unless it's a block, in which case the doc lives in `apps/docs/content/blocks/`).

```bash
# Missing default.example.tsx
find packages/registry/items -mindepth 2 -maxdepth 2 -type d \
  ! -exec test -e {}/default.example.tsx \; -print

# Non-block items missing index.mdx
find packages/registry/items -mindepth 2 -maxdepth 2 -type d \
  ! -path '*/blocks/*' ! -exec test -e {}/index.mdx \; -print

# Items with only one example (default, no variant)
for d in $(find packages/registry/items -mindepth 2 -maxdepth 2 -type d); do
  count=$(ls "$d"/*.example.tsx 2>/dev/null | wc -l)
  [ "$count" -le 1 ] && echo "single example: $d"
done
```

### 10. MDX prose using the wrong stub path

The `creating-registry-item` skill says examples must use the stub alias matching the item's category subdir (`react-hook-form/`, `tanstack-form/`, `tanstack-query/`, or none for `components`). MDX prose snippets often copy-paste the bare `@/components/ui/shuip/<name>` and miss the subdir — leading copy-paste users to module-not-found.

```bash
# RHF / TSF / TSQ items whose MDX uses the bare path
for f in $(find packages/registry/items/react-hook-form packages/registry/items/tanstack-form packages/registry/items/tanstack-query -name index.mdx 2>/dev/null); do
  cat=$(echo "$f" | sed 's|.*items/\([^/]*\)/.*|\1|')
  grep "from '@/components/ui/shuip/" "$f" | grep -v "$cat" \
    && echo "  ^ in $f (should include /$cat/)"
done
```

### 11. Workspace deps not pinned through catalogs

Catalog drift between workspaces breaks reproducibility and may cause subtle version mismatches at consumer end. Every shared external dep should be `"catalog:"` or `"catalog:<name>"`.

```bash
for pkg in apps/*/package.json packages/*/package.json; do
  jq -r '. as $p | (.dependencies // {}) + (.devDependencies // {}) | to_entries[] | "\($p.name)\t\(.key)\t\(.value)"' "$pkg"
done | grep -v 'catalog:\|workspace:\|^[^\t]*\t[^\t]*\t[0-9]' | grep -v 'biome\|husky\|knip\|portless\|rimraf\|turbo\|typescript\|@types/node\|@vercel\|shadcn' || echo OK
```

(Some root-tools — biome, husky, knip, turbo, typescript, etc. — are intentionally not in catalogs because they're devtools, not shared libs. Adjust the exclusion list to taste.)

## Reporting

Group findings by severity. For each:

- File path or pattern
- What's wrong, what it silently breaks
- Suggested fix (don't apply it — surface only)

Sample shape:

```
CRITICAL
  packages/registry/items/components/foo/Component.tsx
    Generator skips the folder (filename must be lowercase).
    Fix: rename to component.tsx.

WARNING
  packages/registry/items/components/bar/
    Missing default.example.tsx; docs page renders empty <ItemExamples>.
    Fix: add default.example.tsx importing via the stub alias.
```

## Common Mistakes During the Audit

| Mistake | Why it matters |
|---------|----------------|
| Running `bun registry:generate` before recording findings | Generator may rewrite the `.gitignore` lists or clear stale stubs before you've inspected them. Inspect first, regen after. |
| Treating `[generate] skipping ...` as benign | That warning means an item is invisible. Always investigate. |
| Trusting `git status` to surface drift in generated files | `registry.json`, `__index__.ts`, `stubs/` are gitignored. Read the file contents directly. |
| Auto-fixing during the audit | Conflates discovery with triage. Many "findings" turn out to be intentional once context is added. |
| Reporting only the file path | Include the silent-failure mode (what breaks, not just "X is wrong"). Pelavo triages by impact. |

## Red Flags

If any of these are true during a build / dev session, run this audit:

- `[generate] N items processed` returned a smaller N than expected after adding files
- A consumer reports a missing file after `shadcn add`
- A docs page renders blank previews or 404s the preview iframe
- A merge / rebase touched `packages/registry/items/`, `packages/registry/scripts/generate.ts`, `turbo.json`, or any tsconfig
- A new category was added but only one of `apps/docs/tsconfig.json` and `packages/registry/tsconfig.json` got the new mapping
