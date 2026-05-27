# shuip Agent Skills — Generator Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the three already-authored skills under `packages/registry/skills/` into shuip's registry pipeline so `npx shadcn add https://shuip.plvo.dev/r/<skill>` installs each as `.claude/skills/<name>/SKILL.md`, plus a `shuip-skills` bundle.

**Architecture:** Approach B — a standalone `packages/registry/scripts/skills.ts` module (pure functions + an `emitSkills` orchestrator) is called from `generate.ts`'s `main()` after the component scan. It resolves a catalog from the in-memory component list, writes catalog-resolved copies to the gitignored `skills/.generated/`, and returns `registry:item` entries that are merged into the shared `registry.json`. `apps/docs/scripts/shadcn-build.ts` already emits `public/r/*.json` generically — no build change.

**Tech Stack:** Bun (runtime + `bun test`), TypeScript 6, Biome (single quotes, 2-space, 120-col, trailing commas), shadcn registry schema.

**Reference:** spec at `docs/superpowers/specs/2026-05-27-shuip-agent-skills-design.md`. Skill sources already committed at `packages/registry/skills/{shuip-overview,shuip-components,shuip-forms}/SKILL.md`.

**Verified facts (do not re-litigate):**
- `apps/docs/scripts/shadcn-build.ts:45-52` — `files` is optional, loop is `for (const file of item.files ?? [])`; schema enum includes `registry:item` and `registry:file`. A files-less bundle and skill file-items both validate and build with no change.
- That schema is non-strict and carries no `title`/`description`, and existing component items omit them too → skill items **omit `title`/`description`**.
- `packages/registry/.gitignore` does not exist; root `.gitignore:58-61` ignores `__index__.ts`, `registry.json`, `stubs/` under a `# registry` block. `registry.json`, `__index__.ts`, `stubs/`, `public/r/` are regenerated, never committed.

---

## File Structure

- **Create** `packages/registry/scripts/skills.ts` — frontmatter parse, catalog resolve, marker replace, name-collision guard, `emitSkills` orchestrator. One responsibility: turning `skills/` sources into registry items + `.generated/` files.
- **Create** `packages/registry/scripts/skills.test.ts` — `bun test` unit tests for the pure functions + an `emitSkills` integration test over a temp fixture dir.
- **Modify** `packages/registry/scripts/generate.ts` — widen `RegistryItem`, export the two registry types, call `emitSkills` from `main()`, merge + collision-check.
- **Modify** `packages/registry/package.json` — add a `test` script.
- **Modify** `.gitignore` — ignore `packages/registry/skills/.generated/`.
- **Modify** `packages/registry/skills/shuip-components/SKILL.md` — replace the catalog marker region with the exact `resolveCatalog` output (source snapshot matches shipped).

---

## Task 1: `bun test` setup + `parseSkillFrontmatter`

**Files:**
- Create: `packages/registry/scripts/skills.ts`
- Create: `packages/registry/scripts/skills.test.ts`
- Modify: `packages/registry/package.json` (scripts block)

- [ ] **Step 1: Add the test script**

In `packages/registry/package.json`, add a `test` script next to `registry:generate`:

```json
    "registry:generate": "bun run scripts/generate.ts",
    "test": "bun test"
```

- [ ] **Step 2: Write the failing test**

Create `packages/registry/scripts/skills.test.ts`:

```ts
import { describe, expect, test } from 'bun:test';
import { parseSkillFrontmatter } from './skills';

describe('parseSkillFrontmatter', () => {
  test('extracts name and description', () => {
    const src = '---\nname: shuip-forms\ndescription: Use when building a form.\n---\n\n# body\n';
    expect(parseSkillFrontmatter(src)).toEqual({
      name: 'shuip-forms',
      description: 'Use when building a form.',
    });
  });

  test('throws when frontmatter is absent', () => {
    expect(() => parseSkillFrontmatter('# no frontmatter')).toThrow('missing YAML frontmatter');
  });

  test('throws when name is missing', () => {
    expect(() => parseSkillFrontmatter('---\ndescription: x\n---\n')).toThrow('missing "name"');
  });

  test('throws when description is missing', () => {
    expect(() => parseSkillFrontmatter('---\nname: x\n---\n')).toThrow('missing "description"');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd packages/registry && bun test scripts/skills.test.ts`
Expected: FAIL — `Cannot find module './skills'` (or "export named 'parseSkillFrontmatter' not found").

- [ ] **Step 4: Write the minimal implementation**

Create `packages/registry/scripts/skills.ts`:

```ts
export function parseSkillFrontmatter(source: string): { name: string; description: string } {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error('skill SKILL.md missing YAML frontmatter');
  const block = match[1];
  const name = block.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = block.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name) throw new Error('skill frontmatter missing "name"');
  if (!description) throw new Error('skill frontmatter missing "description"');
  return { name, description };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd packages/registry && bun test scripts/skills.test.ts`
Expected: PASS — 4 pass, 0 fail.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/scripts/skills.ts packages/registry/scripts/skills.test.ts packages/registry/package.json
git commit -m "feat(skills): add skill frontmatter parser + bun test setup"
```

---

## Task 2: `resolveCatalog`

**Files:**
- Modify: `packages/registry/scripts/skills.ts`
- Test: `packages/registry/scripts/skills.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `skills.test.ts`:

```ts
import { resolveCatalog } from './skills';

describe('resolveCatalog', () => {
  test('groups published names by category in fixed order, sorted, skipping empties', () => {
    const catalog = resolveCatalog([
      { category: 'react-hook-form', publishedName: 'rhf-input-field' },
      { category: 'components', publishedName: 'side-dialog' },
      { category: 'components', publishedName: 'copy-button' },
      { category: 'react-hook-form', publishedName: 'rhf-address-field' },
      { category: 'lib', publishedName: 'time' },
    ]);
    expect(catalog).toBe(
      '**components**\n' +
        '- `copy-button`\n' +
        '- `side-dialog`\n\n' +
        '**react-hook-form**\n' +
        '- `rhf-address-field`\n' +
        '- `rhf-input-field`',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/registry && bun test scripts/skills.test.ts`
Expected: FAIL — `export named 'resolveCatalog' not found`.

- [ ] **Step 3: Write the minimal implementation**

Append to `skills.ts`:

```ts
export interface CatalogItem {
  category: string;
  publishedName: string;
}

const CATALOG_ORDER = ['components', 'blocks', 'react-hook-form', 'tanstack-form', 'tanstack-query'];

export function resolveCatalog(items: CatalogItem[]): string {
  const sections: string[] = [];
  for (const category of CATALOG_ORDER) {
    const names = items
      .filter((i) => i.category === category)
      .map((i) => i.publishedName)
      .sort((a, b) => a.localeCompare(b));
    if (names.length === 0) continue;
    const lines = names.map((n) => `- \`${n}\``).join('\n');
    sections.push(`**${category}**\n${lines}`);
  }
  return sections.join('\n\n');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/registry && bun test scripts/skills.test.ts`
Expected: PASS — all tests pass (`lib` excluded, categories ordered, names sorted).

- [ ] **Step 5: Commit**

```bash
git add packages/registry/scripts/skills.ts packages/registry/scripts/skills.test.ts
git commit -m "feat(skills): resolve item catalog markdown from registry items"
```

---

## Task 3: `applyCatalog` (marker replacement)

**Files:**
- Modify: `packages/registry/scripts/skills.ts`
- Test: `packages/registry/scripts/skills.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `skills.test.ts`:

```ts
import { applyCatalog } from './skills';

describe('applyCatalog', () => {
  test('replaces content between markers, keeping the markers', () => {
    const src = 'before\n<!-- shuip:catalog:start -->\nOLD\nLINES\n<!-- shuip:catalog:end -->\nafter\n';
    const out = applyCatalog(src, '**components**\n- `x`');
    expect(out).toBe(
      'before\n<!-- shuip:catalog:start -->\n**components**\n- `x`\n<!-- shuip:catalog:end -->\nafter\n',
    );
  });

  test('returns source unchanged when no start marker is present', () => {
    const src = '# overview\nno markers here\n';
    expect(applyCatalog(src, 'ANY')).toBe(src);
  });

  test('is idempotent when re-applied with the same catalog', () => {
    const src = '<!-- shuip:catalog:start -->\nA\n<!-- shuip:catalog:end -->\n';
    const once = applyCatalog(src, '**components**\n- `x`');
    expect(applyCatalog(once, '**components**\n- `x`')).toBe(once);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/registry && bun test scripts/skills.test.ts`
Expected: FAIL — `export named 'applyCatalog' not found`.

- [ ] **Step 3: Write the minimal implementation**

Append to `skills.ts` (the marker strings contain no regex metacharacters, so they are used directly):

```ts
const CATALOG_START = '<!-- shuip:catalog:start -->';
const CATALOG_END = '<!-- shuip:catalog:end -->';

export function applyCatalog(source: string, catalog: string): string {
  if (!source.includes(CATALOG_START)) return source;
  const region = new RegExp(`${CATALOG_START}\\n[\\s\\S]*?\\n${CATALOG_END}`);
  return source.replace(region, `${CATALOG_START}\n${catalog}\n${CATALOG_END}`);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/registry && bun test scripts/skills.test.ts`
Expected: PASS — all three `applyCatalog` tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/scripts/skills.ts packages/registry/scripts/skills.test.ts
git commit -m "feat(skills): replace catalog marker region in skill source"
```

---

## Task 4: `assertUniqueNames` (collision guard)

**Files:**
- Modify: `packages/registry/scripts/skills.ts`
- Test: `packages/registry/scripts/skills.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `skills.test.ts`:

```ts
import { assertUniqueNames } from './skills';

describe('assertUniqueNames', () => {
  test('passes when there is no overlap', () => {
    expect(() => assertUniqueNames(['side-dialog', 'rhf-input-field'], ['shuip-forms'])).not.toThrow();
  });

  test('throws naming the colliding item', () => {
    expect(() => assertUniqueNames(['shuip-forms', 'side-dialog'], ['shuip-forms'])).toThrow(
      'collide with component items: shuip-forms',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/registry && bun test scripts/skills.test.ts`
Expected: FAIL — `export named 'assertUniqueNames' not found`.

- [ ] **Step 3: Write the minimal implementation**

Append to `skills.ts`:

```ts
export function assertUniqueNames(componentNames: string[], skillNames: string[]): void {
  const taken = new Set(componentNames);
  const clash = skillNames.filter((n) => taken.has(n));
  if (clash.length > 0) {
    throw new Error(`skill name(s) collide with component items: ${clash.join(', ')}`);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/registry && bun test scripts/skills.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/scripts/skills.ts packages/registry/scripts/skills.test.ts
git commit -m "feat(skills): guard against skill/component name collisions"
```

---

## Task 5: `emitSkills` orchestrator + bundle

**Files:**
- Modify: `packages/registry/scripts/skills.ts`
- Test: `packages/registry/scripts/skills.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `skills.test.ts` (an integration test over a temp fixture dir):

```ts
import { afterAll, beforeAll } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { emitSkills } from './skills';

describe('emitSkills', () => {
  let root: string;
  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-skills-'));
    const skillsDir = path.join(root, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'demo'), { recursive: true });
    fs.writeFileSync(
      path.join(skillsDir, 'demo', 'SKILL.md'),
      '---\nname: demo\ndescription: A demo.\n---\n<!-- shuip:catalog:start -->\nOLD\n<!-- shuip:catalog:end -->\n',
    );
  });
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  test('writes resolved files and returns skill items + bundle', () => {
    const skillsDir = path.join(root, 'skills');
    const items = emitSkills({
      skillsDir,
      generatedDir: path.join(skillsDir, '.generated'),
      registryRoot: root,
      catalog: '**components**\n- `x`',
      registryBaseUrl: 'https://shuip.plvo.dev/r',
      bundleName: 'shuip-skills',
    });

    const written = fs.readFileSync(path.join(skillsDir, '.generated', 'demo', 'SKILL.md'), 'utf-8');
    expect(written).toContain('**components**\n- `x`');
    expect(written).not.toContain('OLD');

    expect(items).toEqual([
      {
        name: 'demo',
        type: 'registry:item',
        files: [{ path: './skills/.generated/demo/SKILL.md', type: 'registry:file', target: '.claude/skills/demo/SKILL.md' }],
      },
      {
        name: 'shuip-skills',
        type: 'registry:item',
        registryDependencies: ['https://shuip.plvo.dev/r/demo'],
      },
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/registry && bun test scripts/skills.test.ts`
Expected: FAIL — `export named 'emitSkills' not found`.

- [ ] **Step 3: Write the minimal implementation**

Add the imports at the top of `skills.ts` (above the existing functions):

```ts
import fs from 'node:fs';
import path from 'node:path';
import type { RegistryItem } from './generate';
```

Append to `skills.ts`:

```ts
export interface EmitSkillsOptions {
  skillsDir: string;
  generatedDir: string;
  registryRoot: string;
  catalog: string;
  registryBaseUrl: string;
  bundleName: string;
}

export function emitSkills(opts: EmitSkillsOptions): RegistryItem[] {
  const { skillsDir, generatedDir, registryRoot, catalog, registryBaseUrl, bundleName } = opts;
  fs.rmSync(generatedDir, { recursive: true, force: true });
  if (!fs.existsSync(skillsDir)) return [];

  const dirs = fs
    .readdirSync(skillsDir)
    .filter((d) => d !== '.generated' && fs.statSync(path.join(skillsDir, d)).isDirectory())
    .sort();

  const items: RegistryItem[] = [];
  const skillNames: string[] = [];

  for (const dir of dirs) {
    const skillMd = path.join(skillsDir, dir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      console.warn(`[generate] skipping skill ${dir}: no SKILL.md`);
      continue;
    }
    const source = fs.readFileSync(skillMd, 'utf-8');
    const { name } = parseSkillFrontmatter(source);
    const resolved = applyCatalog(source, catalog);
    const outPath = path.join(generatedDir, name, 'SKILL.md');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, resolved);
    const relPath = path.relative(registryRoot, outPath).replace(/\\/g, '/');
    items.push({
      name,
      type: 'registry:item',
      files: [{ path: `./${relPath}`, type: 'registry:file', target: `.claude/skills/${name}/SKILL.md` }],
    });
    skillNames.push(name);
  }

  if (skillNames.length > 0) {
    items.push({
      name: bundleName,
      type: 'registry:item',
      registryDependencies: skillNames.map((n) => `${registryBaseUrl}/${n}`),
    });
  }

  return items;
}
```

Note: `import type { RegistryItem }` is erased at runtime — `skills.ts` never executes `generate.ts`, so there is no circular dependency. `RegistryItem` is widened to accept this shape in Task 6; until then `bun test` (which strips the type import) passes, but `tsc` would flag the type — that is expected and resolved in the next task.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/registry && bun test scripts/skills.test.ts`
Expected: PASS — resolved file written with catalog substituted, two items returned (skill + bundle).

- [ ] **Step 5: Commit**

```bash
git add packages/registry/scripts/skills.ts packages/registry/scripts/skills.test.ts
git commit -m "feat(skills): emit resolved skill files and registry items"
```

---

## Task 6: Wire `emitSkills` into `generate.ts`

**Files:**
- Modify: `packages/registry/scripts/generate.ts:11-23` (export + widen types), `:341-351` (`main`)

- [ ] **Step 1: Export and widen the registry types**

Replace the `RegistryFile` and `RegistryItem` interface declarations (`generate.ts:11-23`) with:

```ts
export interface RegistryFile {
  path: string;
  type: 'registry:ui' | 'registry:block' | 'registry:lib' | 'registry:file';
  target?: string;
}

export interface RegistryItem {
  name: string;
  type: 'registry:ui' | 'registry:block' | 'registry:lib' | 'registry:item';
  dependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryFile[];
}
```

- [ ] **Step 2: Import the skills module**

Add to the import block at the top of `generate.ts` (after the `node:path` import):

```ts
import { assertUniqueNames, emitSkills, resolveCatalog } from './skills';
```

- [ ] **Step 3: Add skills directory constants**

After the existing `const COMPONENTS_CONTENT_DIR = ...` line (`generate.ts:9`), add:

```ts
const SKILLS_DIR = path.join(ROOT, 'skills');
const SKILLS_GENERATED_DIR = path.join(SKILLS_DIR, '.generated');
```

- [ ] **Step 4: Merge skill items in `main()`**

Replace the `main` function (`generate.ts:341-351`) with:

```ts
const main = () => {
  const items = scanItems();
  const registry = buildRegistryJson(items);

  const catalogItems = items.map((i) => ({
    category: i.category,
    publishedName: namePrefix(i.category, i.folderName),
  }));
  const skillItems = emitSkills({
    skillsDir: SKILLS_DIR,
    generatedDir: SKILLS_GENERATED_DIR,
    registryRoot: ROOT,
    catalog: resolveCatalog(catalogItems),
    registryBaseUrl: 'https://shuip.plvo.dev/r',
    bundleName: 'shuip-skills',
  });
  assertUniqueNames(
    registry.items.map((i) => i.name),
    skillItems.map((i) => i.name),
  );
  registry.items.push(...skillItems);
  registry.items.sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(path.join(ROOT, 'registry.json'), `${JSON.stringify(registry, null, 2)}\n`);
  fs.writeFileSync(path.join(ROOT, '__index__.ts'), buildIndexTs(items));
  writeStubs(items);
  writeComponentSymlinks(items);
  console.log(`[generate] ${items.length} items + ${skillItems.length} skill items processed`);
};
```

- [ ] **Step 5: Typecheck the package**

Run: `cd packages/registry && bunx tsc --noEmit`
Expected: PASS — no type errors (the `RegistryItem` widening makes `skillItems` assignable; the type-only import resolves).

- [ ] **Step 6: Run the generator**

Run: `cd packages/registry && bun run scripts/generate.ts`
Expected: STDOUT ends with `[generate] 46 items + 4 skill items processed` (42 component items + 4 lib/etc. as currently reported, plus 4 skill items = 3 skills + 1 bundle). Confirm the skill-item count is exactly `4` and there are no `skipping skill` warnings.

- [ ] **Step 7: Commit**

```bash
git add packages/registry/scripts/generate.ts
git commit -m "feat(skills): merge skill items into registry generation"
```

---

## Task 7: Catalog source snapshot + gitignore

**Files:**
- Modify: `.gitignore`
- Modify: `packages/registry/skills/shuip-components/SKILL.md` (catalog marker region)

- [ ] **Step 1: Ignore the generated skills directory**

In `.gitignore`, under the `# registry` block (after the `stubs/` line at `:61`), add:

```
packages/registry/skills/.generated/
```

- [ ] **Step 2: Verify the generated dir is now ignored**

Run: `git check-ignore packages/registry/skills/.generated/shuip-forms/SKILL.md`
Expected: STDOUT prints the path (it is ignored). If it prints nothing, the pattern is wrong — fix before continuing.

- [ ] **Step 3: Align the source catalog snapshot with generator output**

Open the generated file the generator just wrote and copy its marker region into the source so the human-readable source matches what ships. Run:

```bash
sed -n '/<!-- shuip:catalog:start -->/,/<!-- shuip:catalog:end -->/p' \
  packages/registry/skills/.generated/shuip-components/SKILL.md
```

Replace the entire region between `<!-- shuip:catalog:start -->` and `<!-- shuip:catalog:end -->` in `packages/registry/skills/shuip-components/SKILL.md` with that output. It must read exactly:

```
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
```

(If the generated output differs from the above — e.g. an item was added since this plan — trust the generated output; it is the source of truth.)

- [ ] **Step 4: Re-run the generator and confirm the source region is stable**

Run: `cd packages/registry && bun run scripts/generate.ts && diff <(sed -n '/<!-- shuip:catalog:start -->/,/<!-- shuip:catalog:end -->/p' skills/shuip-components/SKILL.md) <(sed -n '/<!-- shuip:catalog:start -->/,/<!-- shuip:catalog:end -->/p' skills/.generated/shuip-components/SKILL.md)`
Expected: no diff output (source snapshot equals shipped catalog).

- [ ] **Step 5: Commit**

```bash
git add .gitignore packages/registry/skills/shuip-components/SKILL.md
git commit -m "feat(skills): ignore generated skills dir and snapshot catalog"
```

---

## Task 8: Build the registry and prove the install payload

**Files:** none modified (verification only; outputs under `apps/docs/public/r/` are gitignored).

- [ ] **Step 1: Build the public registry JSON**

Run: `bun registry:build`
Expected: STDOUT `[shadcn-build] N items written ...` with N = component items + 4. No Zod validation error (proves the files-less bundle and `registry:file` skill items pass the schema — Flag 1 + Flag 2).

- [ ] **Step 2: Verify a skill item inlines its content and targets `.claude/`**

Run:
```bash
cat apps/docs/public/r/shuip-forms.json | bun -e 'const j=JSON.parse(require("fs").readFileSync(0));console.log(j.type, j.files[0].type, j.files[0].target, j.files[0].content.includes("Building forms with shuip"))'
```
Expected: `registry:item registry:file .claude/skills/shuip-forms/SKILL.md true`

- [ ] **Step 3: Verify the bundle aggregates the three skills with full URLs**

Run:
```bash
cat apps/docs/public/r/shuip-skills.json | bun -e 'const j=JSON.parse(require("fs").readFileSync(0));console.log(j.type, j.files??"no-files", JSON.stringify(j.registryDependencies))'
```
Expected: `registry:item no-files ["https://shuip.plvo.dev/r/shuip-components","https://shuip.plvo.dev/r/shuip-forms","https://shuip.plvo.dev/r/shuip-overview"]`

- [ ] **Step 4: Verify shuip-components ships the generated catalog**

Run:
```bash
cat apps/docs/public/r/shuip-components.json | bun -e 'const j=JSON.parse(require("fs").readFileSync(0));const c=j.files[0].content;console.log(c.includes("- `rhf-input-field`") && c.includes("- `tsf-form-context`") && !c.includes("shuip:catalog:start") === false)'
```
Expected: `true` (catalog names present; markers still wrap them).

- [ ] **Step 5 (optional, real end-to-end install):** Serve and install into a throwaway app.

```bash
# terminal A: serve the built registry
bunx serve apps/docs/public -p 8741
# terminal B:
cd "$(mktemp -d)" && npm create next-app@latest app --yes >/dev/null 2>&1 && cd app
npx shadcn@latest init --yes >/dev/null 2>&1
npx shadcn@latest add "http://localhost:8741/r/shuip-forms.json"
test -f .claude/skills/shuip-forms/SKILL.md && echo "INSTALLED OK"
```
Expected: `INSTALLED OK` and the file contains the forms skill. (Skip if no network for `create next-app`; Steps 1-4 already prove the payload deterministically.)

- [ ] **Step 6: No commit** — all outputs here are gitignored. Proceed to Task 9.

---

## Task 9: Full build gate + final verification

**Files:** none modified (verification only).

- [ ] **Step 1: Run the unit tests once more**

Run: `cd packages/registry && bun test`
Expected: PASS — all `skills.test.ts` tests green.

- [ ] **Step 2: Run the authoritative type/build gate**

Run: `NODE_OPTIONS=--max-old-space-size=6144 bun build:docs`
Expected: success (chains `registry:generate` → `registry:build` → `next build`). The heap flag avoids the known WSL2 OOM (exit 137).

- [ ] **Step 3: Confirm the working tree has only source changes**

Run: `git status --short`
Expected: clean (everything committed; no stray `registry.json`, `.generated/`, `stubs/`, or `public/r/` changes — all gitignored).

- [ ] **Step 4: Confirm the skills are absent from the live-preview index**

Run: `grep -c 'shuip-forms' packages/registry/__index__.ts || echo 0`
Expected: `0` — skills are docs, not React components, so they must not appear in `REGISTRY_INDEX`.

---

## Self-Review

**Spec coverage:**
- Source layout / `.generated/` (spec §1) → Tasks 5, 7.
- Registry item shape, project-relative target, files-less bundle with full URLs (spec §2) → Tasks 5, 8.
- Generation flow: scan, resolveCatalog from in-memory items, marker replace, merge, collision assert (spec §3) → Tasks 2-6.
- Skill content (spec §4) → already authored/committed; not in this plan.
- Docs page (spec §5) → deferred, intentionally out of scope.
- Silent-failure guards: missing SKILL.md warn, missing frontmatter throw, `.generated/` gitignored, collision throw (spec §6) → Tasks 1 (frontmatter), 4 (collision), 5 (missing-file warn), 7 (gitignore).
- Validation: generator assertions, build, smoke test (spec §7) → Tasks 6, 8, 9.
- Open flags (files-less bundle, generic build) → resolved in plan preamble; proven in Task 8.
- New finding: skill items omit `title`/`description` → reflected in Task 5 item shape.

**Placeholder scan:** none — every code/command step has concrete content.

**Type consistency:** `RegistryItem`/`RegistryFile` widened in Task 6 match the objects `emitSkills` returns in Task 5; `CatalogItem` (Task 2) matches the `catalogItems` shape passed in Task 6; `emitSkills` option names are identical between Task 5 implementation, its test, and the Task 6 call site; `parseSkillFrontmatter`/`applyCatalog`/`resolveCatalog`/`assertUniqueNames` signatures are stable across tasks.
