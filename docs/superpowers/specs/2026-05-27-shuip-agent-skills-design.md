# shuip Agent Skills — Design

Date: 2026-05-27
Status: Approved (brainstorming) — pending implementation
Branch: `feat/agent-skills`

## Goal

Ship agent skills alongside shuip's components so a downstream developer's coding
agent learns to: present shuip and its purpose, contextualize components (when/how
to use them), and build a prod-grade form with react-hook-form and tanstack-form.

## Decisions

| Decision | Choice |
|----------|--------|
| Audience | Portable vision (any coding agent); **MVP ships Claude Code `SKILL.md` only**. Authoring layer stays format-agnostic so Cursor `.mdc` / AGENTS emission is additive later. |
| Granularity | **3 skills, layered by purpose**: `shuip-overview`, `shuip-components`, `shuip-forms`. |
| Packaging | Each skill is a standalone registry item, **plus a `shuip-skills` bundle** that pulls all three. |
| Forms scope | Guidance over **existing** `rhf-*`/`tsf-*` items (both libs + when to choose). **No new components.** |
| Generator integration | **Approach B**: parallel `skills/` source tree + a focused emit pass that merges into the shared `registry.json`. Component pipeline untouched. |
| Catalog sync | **Auto-embed** a catalog generated from the in-memory component list, so overview/components skills never drift. |
| Docs site page | **Deferred** — out of MVP scope. |

## 1. Source layout

A tree sibling to `items/`, because skills are a different kind of artifact (agent
docs, not React components):

```
packages/registry/skills/
  shuip-overview/SKILL.md
  shuip-components/SKILL.md
  shuip-forms/SKILL.md
  .generated/<name>/SKILL.md      catalog-resolved output, gitignored
```

`SKILL.md` is the source of truth: Claude Code frontmatter (`name`, `description`)
plus body. The body may contain a catalog token (see §3). Folder name == published
registry name; the `shuip-` prefix namespaces skills away from component item names,
so no collision.

## 2. Registry item shape

Each skill emits one `registry:item` with a single `registry:file`, target
**project-relative** so it lands in the consumer's repo and versions with their code:

```json
{
  "name": "shuip-forms",
  "type": "registry:item",
  "title": "shuip Forms",
  "description": "Build prod-grade forms with shuip's rhf/tsf field items.",
  "files": [{
    "path": "./skills/.generated/shuip-forms/SKILL.md",
    "type": "registry:file",
    "target": ".claude/skills/shuip-forms/SKILL.md"
  }]
}
```

The **bundle** `shuip-skills` is a files-less aggregator using `registryDependencies`
(full URLs, matching the existing install-command style) to pull all three skills.

> **Open flag (verify in plan):** confirm shadcn accepts a files-less `registry:item`.
> If not, the bundle carries a tiny README file as its single `registry:file`.

## 3. Generation flow (Approach B)

A focused skills pass added to `generate.ts`, running **after** `scanItems()` so it
reuses the in-memory component list — the catalog is generated from the exact same
source that builds `registry.json`, in one run:

1. `scanSkills()` — read each `SKILL.md`, parse frontmatter, validate `name` + `description` present.
2. `resolveCatalog(items)` — build a "current items by category" markdown block from the scanned components.
3. Replace `<!-- shuip:catalog [category="..."] -->` token → write the resolved file to `skills/.generated/<name>/SKILL.md`.
4. `buildSkillRegistryItems()` — produce the items, merge into the same `registry.json` array, re-sort, assert name-uniqueness against component items.

`registry:build` (`scripts/shadcn-build.ts`) then emits `public/r/shuip-*.json`
automatically — skills are standard registry items.

> **Open flag (verify in plan):** confirm `shadcn-build.ts` iterates items generically
> and inlines `registry:file` content.

## 4. The three skills — content outline

- **`shuip-overview`** — *trigger:* working in a shuip project. What shuip is, the
  `npx shadcn add https://shuip.plvo.dev/r/<name>` model, the categories, full
  `<!-- shuip:catalog -->`, and routing ("for forms → shuip-forms; for picking →
  shuip-components").
- **`shuip-components`** — *trigger:* choosing/composing components. Decision guidance
  per category, composition patterns, `<!-- shuip:catalog category="components,blocks" -->`,
  doc links.
- **`shuip-forms`** (flagship) — *trigger:* building a form. Choosing rhf vs tsf; zod
  schema; wiring the `rhf-*`/`tsf-*` field items (the `register` prop pattern from
  `input-field`); server-action submission; error/loading/disabled states; a11y; one
  complete annotated example assembled from existing items. **No new components.**

## 5. Docs site

Deferred. A short guide page under the existing `docs` collection presenting the skills
and their `shadcn add` commands may be added later; not in MVP.

## 6. Silent-failure guards

Per shuip's `debugging-shuip-silent-failures` ethos:

- Missing `SKILL.md` → `[generate] skipping skill <name>` warning (mirrors the component scanner).
- Missing/empty `name` or `description` frontmatter → **fail loudly** (skill won't trigger otherwise).
- Catalog token with unknown category → warn.
- `.generated/` added to `.gitignore` (honors "generated artifacts never committed").
- Skill/component name collision → throw on merge.

## 7. Validation

No test runner is configured (per CLAUDE.md). MVP validation:

- Generator assertions: item counts, resolved tokens, no unexpected warnings.
- `bun build:docs` end-to-end.
- Manual `shadcn add` smoke test into a scratch dir → confirm
  `.claude/skills/shuip-forms/SKILL.md` lands with inlined content.

A formal automated test setup will be **proposed before** any tests are written, per CLAUDE.md.

## Open flags to resolve during planning

1. Files-less bundle `registry:item` accepted by shadcn? (else bundle ships a README file)
2. `shadcn-build.ts` handles `registry:item` + `registry:file` generically?
