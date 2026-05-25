# Time fields: Select picker + time range — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the native time picker in `rhf-time-field`/`tsf-time-field` with a shadcn `Select` picker (hours `00`–`23`, minutes by 5), and add `rhf-time-range`/`tsf-time-range`, sharing all `HH:mm` logic in a new `lib/time` registry item.

**Architecture:** A new `lib` category in the registry generator distributes pure logic to `lib/time.ts` (imported as `@/lib/time`), auto-wired as a `registryDependency` like `tsf-form-context`. Each form field renders its own small two-`Select` markup inline and consumes the shared helpers.

**Tech Stack:** Bun, TypeScript, React 19, shadcn/ui `Select`, `@hookform/lenses` + react-hook-form, `@tanstack/react-form`, Zod, Biome.

**No tests this PR** (no runner configured — tracked in issue #53). Per-task verification is `bun registry:generate`, `bun registry:build`, `bun build:docs`, `bun check`.

**Commit hygiene:** `registry.json`, `__index__.ts`, `stubs/` are git-ignored — never `git add` them. `apps/docs/public/r/` is tracked — commit it after `registry:build`.

---

## File Structure

- Create `packages/registry/items/lib/time/time.ts` — pure `HH:mm` logic.
- Modify `packages/registry/scripts/generate.ts` — add `lib` category support.
- Modify `packages/registry/tsconfig.json` + `apps/docs/tsconfig.json` — `@/lib/time` alias.
- Modify `packages/registry/items/react-hook-form/time-field/{component.tsx,index.mdx}`.
- Modify `packages/registry/items/tanstack-form/time-field/{component.tsx,validation.example.tsx,index.mdx}`.
- Create `packages/registry/items/react-hook-form/time-range/{component.tsx,default.example.tsx,index.mdx}`.
- Create `packages/registry/items/tanstack-form/time-range/{component.tsx,default.example.tsx,index.mdx}`.

---

## Task 1: Add `lib` category support to the generator

**Files:**
- Modify: `packages/registry/scripts/generate.ts`
- Modify: `packages/registry/tsconfig.json`
- Modify: `apps/docs/tsconfig.json`

- [ ] **Step 1: Widen the type unions to include `registry:lib`**

In `packages/registry/scripts/generate.ts`, change the three interface definitions and the `categoryToType` return type. Lines 11-33 (`RegistryFile.type`, `RegistryItem.type`, `CategoryConfig.itemType`):

```ts
interface RegistryFile {
  path: string;
  type: 'registry:ui' | 'registry:block' | 'registry:lib' | 'registry:file';
  target?: string;
}

interface RegistryItem {
  name: string;
  type: 'registry:ui' | 'registry:block' | 'registry:lib';
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
}

interface ItemMeta {
  dependsOn?: string[];
}

interface CategoryConfig {
  itemType: 'registry:ui' | 'registry:block' | 'registry:lib';
  targetPath: string;
  prefix?: string;
}
```

- [ ] **Step 2: Register the `lib` category**

In `CATEGORIES` (line 35-53), add a `lib` entry. Insert before the closing `} as const`:

```ts
  blocks: { itemType: 'registry:block', targetPath: './components/block/shuip' },
  lib: { itemType: 'registry:lib', targetPath: './lib' },
} as const satisfies Record<string, CategoryConfig>;
```

- [ ] **Step 3: Widen `categoryToType` and make `computeTarget` emit `.ts` for lib**

Replace lines 59 and 66:

```ts
const categoryToType = (cat: Category): 'registry:ui' | 'registry:block' | 'registry:lib' => CATEGORIES[cat].itemType;
```

```ts
const computeTarget = (cat: Category, name: string): string => {
  const ext = cat === 'lib' ? 'ts' : 'tsx';
  return `${CATEGORIES[cat].targetPath}/${name}.${ext}`;
};
```

- [ ] **Step 4: Add the `@/lib/<name>` dependency parser**

Immediately after `parseShuipDeps` (ends line 124), add:

```ts
// Parse @/lib/<name> imports → registryDependencies (shuip-internal lib items).
// Excludes `utils`, which shadcn provides via `npx shadcn init`.
const parseLibDeps = (source: string): string[] => {
  const regex = /from\s+['"]@\/lib\/([^'"/]+)['"]/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(source)) !== null) {
    if (m[1] && m[1] !== 'utils') out.add(m[1]);
  }
  return Array.from(out).sort();
};
```

- [ ] **Step 5: Merge lib deps into `registryDependencies`**

In `buildRegistryJson`, the block at lines 186-191 currently reads:

```ts
    const source = fs.readFileSync(componentPath, 'utf-8');
    const dependencies = parseImports(source);
    const registryDependencies = parseRegistryDeps(source);
    const shuipDeps = parseShuipDeps(source);
    const meta = readMeta(item.itemDir);
    const fullDeps = Array.from(new Set([...registryDependencies, ...shuipDeps, ...(meta.dependsOn ?? [])])).sort();
```

Replace with:

```ts
    const source = fs.readFileSync(componentPath, 'utf-8');
    const dependencies = parseImports(source);
    const registryDependencies = parseRegistryDeps(source);
    const shuipDeps = parseShuipDeps(source);
    const libDeps = parseLibDeps(source);
    const meta = readMeta(item.itemDir);
    const fullDeps = Array.from(
      new Set([...registryDependencies, ...shuipDeps, ...libDeps, ...(meta.dependsOn ?? [])]),
    ).sort();
```

- [ ] **Step 6: Use the per-category main file name in `scanItems`**

In `scanItems`, the block at lines 161-166 currently reads:

```ts
      const itemDir = path.join(catDir, folderName);
      const componentPath = path.join(itemDir, 'component.tsx');
      if (!fs.existsSync(componentPath)) {
        console.warn(`[generate] skipping ${category}/${folderName}: no component.tsx`);
        continue;
      }
```

Replace with:

```ts
      const itemDir = path.join(catDir, folderName);
      const mainFile = category === 'lib' ? `${folderName}.ts` : 'component.tsx';
      const componentPath = path.join(itemDir, mainFile);
      if (!fs.existsSync(componentPath)) {
        console.warn(`[generate] skipping ${category}/${folderName}: no ${mainFile}`);
        continue;
      }
```

- [ ] **Step 7: Skip lib items in `buildIndexTs` (no React preview)**

In `buildIndexTs`, the loop starts at line 243 with `for (const item of items) {`. Add a guard as the first line inside the loop:

```ts
  for (const item of items) {
    if (item.category === 'lib') continue;
    const { category, folderName, componentPath, examples } = item;
```

- [ ] **Step 8: Skip lib items in `writeStubs` (imported via `@/lib/*`, not the shuip alias)**

In `writeStubs` (line 274), add a guard as the first line inside the loop:

```ts
  for (const item of items) {
    if (item.category === 'lib') continue;
    const stubPath = computeStubPath(item.category, item.folderName);
```

- [ ] **Step 9: Add the `@/lib/time` alias to the registry tsconfig**

In `packages/registry/tsconfig.json`, find the line `"@/lib/utils": ["../ui/src/lib/utils"],` and add directly below it:

```json
      "@/lib/time": ["./items/lib/time/time"],
```

- [ ] **Step 10: Add the `@/lib/time` alias to the docs tsconfig**

In `apps/docs/tsconfig.json`, find the line `"@/lib/utils": ["../../packages/ui/src/lib/utils"],` and add directly below it:

```json
      "@/lib/time": ["../../packages/registry/items/lib/time/time"],
```

- [ ] **Step 11: Verify no regression on existing items**

Run: `bun registry:generate`
Expected: prints `[generate] N items processed` with the same N as before (no new item yet), no `skipping unknown category` warning, no crash.

Run: `bun check`
Expected: Biome passes (the generator edits are formatted).

- [ ] **Step 12: Commit**

```bash
git add packages/registry/scripts/generate.ts packages/registry/tsconfig.json apps/docs/tsconfig.json
git commit -m "feat(registry): support registry:lib items in generator"
```

---

## Task 2: Create the `lib/time` item

**Files:**
- Create: `packages/registry/items/lib/time/time.ts`

- [ ] **Step 1: Write the pure logic module**

Create `packages/registry/items/lib/time/time.ts`:

```ts
export const MINUTE_STEP = 5;

export const HOUR_OPTIONS: string[] = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

export const MINUTE_OPTIONS: string[] = Array.from({ length: 60 / MINUTE_STEP }, (_, i) =>
  String(i * MINUTE_STEP).padStart(2, '0'),
);

export type TimeRangeValue = { start: string; end: string };

export function splitTime(time: string): { hour: string; minute: string } {
  const [hour = '', minute = ''] = time.split(':');
  return { hour, minute };
}

export function joinTime(hour: string, minute: string): string {
  if (!hour && !minute) return '';
  return `${hour || '00'}:${minute || '00'}`;
}

export function toMinutes(time: string): number | null {
  const { hour, minute } = splitTime(time);
  if (!hour || !minute) return null;
  const h = Number(hour);
  const m = Number(minute);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const clamped = Math.max(0, Math.min(total, 24 * 60 - 1));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addOneHour(time: string): string {
  const minutes = toMinutes(time);
  if (minutes === null) return time;
  return fromMinutes(minutes + 60);
}

export function nextSlot(time: string): string {
  const minutes = toMinutes(time);
  if (minutes === null) return time;
  return fromMinutes(minutes + MINUTE_STEP);
}

export function isHourDisabled(hour: string, bounds?: { min?: string; max?: string }): boolean {
  if (!hour) return false;
  const h = Number(hour);
  if (Number.isNaN(h)) return false;
  const hourStart = h * 60;
  const hourEnd = h * 60 + 55;
  const min = bounds?.min ? toMinutes(bounds.min) : null;
  const max = bounds?.max ? toMinutes(bounds.max) : null;
  if (min !== null && hourEnd < min) return true;
  if (max !== null && hourStart > max) return true;
  return false;
}

export function isMinuteDisabled(minute: string, hour: string, bounds?: { min?: string; max?: string }): boolean {
  if (!hour || !minute) return false;
  const t = toMinutes(joinTime(hour, minute));
  if (t === null) return false;
  const min = bounds?.min ? toMinutes(bounds.min) : null;
  const max = bounds?.max ? toMinutes(bounds.max) : null;
  if (min !== null && t < min) return true;
  if (max !== null && t > max) return true;
  return false;
}
```

- [ ] **Step 2: Generate and verify the lib item wiring**

Run: `bun registry:generate`
Expected: `[generate] N items processed` (N increased by 1), no warnings.

Run: `grep -A8 '"name": "time"' packages/registry/registry.json`
Expected output contains:

```json
    {
      "name": "time",
      "type": "registry:lib",
      "files": [
        {
          "path": "./items/lib/time/time.ts",
          "type": "registry:lib",
          "target": "./lib/time.ts"
        }
      ]
    }
```

(No `dependencies` / `registryDependencies` keys — the module has no imports.)

- [ ] **Step 3: Build the served registry and verify the lib JSON**

Run: `bun registry:build`
Expected: `[shadcn-build] N items written` and a new `apps/docs/public/r/time.json` exists with inlined `content`.

- [ ] **Step 4: Commit**

```bash
git add packages/registry/items/lib/time/time.ts apps/docs/public/r/time.json
git commit -m "feat(time): add shared HH:mm time logic lib"
```

---

## Task 3: Convert `rhf-time-field` to the Select picker

**Files:**
- Modify: `packages/registry/items/react-hook-form/time-field/component.tsx`
- Modify: `packages/registry/items/react-hook-form/time-field/index.mdx`

(The two examples need no change: value stays a `"HH:mm"` string and `min`/`max` remain direct props.)

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `packages/registry/items/react-hook-form/time-field/component.tsx`:

```tsx
'use client';

import type { Lens } from '@hookform/lenses';
import { useController } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HOUR_OPTIONS, MINUTE_OPTIONS, isHourDisabled, isMinuteDisabled, joinTime, splitTime } from '@/lib/time';

export interface TimeFieldProps {
  lens: Lens<string>;
  label?: string;
  description?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}

export function TimeField({ lens, label, description, min, max, disabled }: TimeFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const { hour, minute } = splitTime(field.value ?? '');
  const bounds = { min, max };

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <div className='flex items-center gap-2'>
        <Select value={hour} onValueChange={(h) => field.onChange(joinTime(h, minute))} disabled={disabled}>
          <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className='w-full'>
            <SelectValue placeholder='HH' />
          </SelectTrigger>
          <SelectContent>
            {HOUR_OPTIONS.map((h) => (
              <SelectItem key={h} value={h} disabled={isHourDisabled(h, bounds)}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className='text-muted-foreground'>:</span>
        <Select value={minute} onValueChange={(m) => field.onChange(joinTime(hour, m))} disabled={disabled}>
          <SelectTrigger aria-invalid={fieldState.invalid} className='w-full'>
            <SelectValue placeholder='mm' />
          </SelectTrigger>
          <SelectContent>
            {MINUTE_OPTIONS.map((m) => (
              <SelectItem key={m} value={m} disabled={isMinuteDisabled(m, hour, bounds)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
```

- [ ] **Step 2: Rewrite the doc page**

Replace the entire contents of `packages/registry/items/react-hook-form/time-field/index.mdx`:

````mdx
---
title: Time Field
description: Time picker (HH:mm) integrated with React Hook Form via typed lens binding from @hookform/lenses. Two shadcn Select inputs for hours and minutes.
registryName: rhf-time-field
---

`TimeField` is a time-only picker built from two shadcn/ui `Select` inputs — hours `00`–`23` and minutes in 5-minute steps. It binds to a `string` in the `HH:mm` 24-hour format, encapsulating React Hook Form's field management.

The field binds to the form via a typed lens from [`@hookform/lenses`](https://github.com/react-hook-form/lenses) — no call-site generic, just `lens.focus('fieldName')` with full autocomplete from your form's value type.

#### Built-in features

- **Two-select picker**: hours and minutes as shadcn `Select` inputs — consistent styling, full keyboard support, no native-input inconsistencies across browsers
- **Typed lens binding**: `lens.focus('meetingTime')` autocompletes from your form's value type
- **Range constraints**: pass `min` / `max` (as `HH:mm` strings) to disable out-of-range hour and minute options
- **Zod validation**: native integration with react-hook-form and Zod via resolver

## Setup

Field components bind via `@hookform/lenses`. Create a lens once per form:

```tsx
import { useLens } from '@hookform/lenses';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { TimeField } from '@/components/ui/shuip/react-hook-form/time-field';

const form = useForm<MyForm>({ defaultValues: { meetingTime: '' } });
const lens = useLens({ control: form.control });

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <TimeField lens={lens.focus('meetingTime')} label='Meeting time' />
  </form>
</Form>
```

The value is a `string` in `HH:mm` format (or empty string when unset). Picking only the hour or only the minute defaults the other part to `00`.

## Constraining the range

`min` and `max` accept `HH:mm` strings. Out-of-range hour and minute options are disabled in the dropdowns. Always validate via Zod (and server-side) for safety:

```tsx
const schema = z.object({
  appointment: z
    .string()
    .min(1, 'Required')
    .refine((v) => v >= '09:00' && v <= '18:00', 'Outside office hours'),
});

<TimeField lens={lens.focus('appointment')} label='Appointment' min='09:00' max='18:00' />
```

import { TypeTable } from 'fumadocs-ui/components/type-table';

## Examples

<ItemExamples registryName={'rhf-time-field'} />

## Props

<TypeTable
  type={{
    lens: {
      description: 'Typed lens from useLens (see Setup section). Bound to a HH:mm string.',
      type: 'Lens<string>',
    },
    label: {
      description: 'Field label text',
      type: 'string?',
    },
    description: {
      description: 'Helper text displayed below the picker',
      type: 'string?',
    },
    min: {
      description: 'Earliest selectable time as a HH:mm string. Out-of-range options are disabled.',
      type: 'string?',
    },
    max: {
      description: 'Latest selectable time as a HH:mm string. Out-of-range options are disabled.',
      type: 'string?',
    },
    disabled: {
      description: 'Disables both selects',
      type: 'boolean?',
    },
  }}
/>
````

- [ ] **Step 3: Generate and verify dependencies**

Run: `bun registry:generate`
Expected: no warnings.

Run: `grep -A18 '"name": "rhf-time-field"' packages/registry/registry.json`
Expected: `registryDependencies` is exactly `["field", "select", "time"]` and `dependencies` includes `@hookform/lenses` and `react-hook-form`.

- [ ] **Step 4: Build the served registry**

Run: `bun registry:build`
Expected: `apps/docs/public/r/rhf-time-field.json` updated; its `content` shows the two-select component.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/items/react-hook-form/time-field apps/docs/public/r/rhf-time-field.json
git commit -m "refactor(rhf-time-field)!: replace native input with Select picker (HH:mm)"
```

---

## Task 4: Convert `tsf-time-field` to the Select picker

**Files:**
- Modify: `packages/registry/items/tanstack-form/time-field/component.tsx`
- Modify: `packages/registry/items/tanstack-form/time-field/validation.example.tsx`
- Modify: `packages/registry/items/tanstack-form/time-field/index.mdx`

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `packages/registry/items/tanstack-form/time-field/component.tsx`:

```tsx
'use client';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { HOUR_OPTIONS, MINUTE_OPTIONS, isHourDisabled, isMinuteDisabled, joinTime, splitTime } from '@/lib/time';

export interface TimeFieldProps {
  label?: string;
  description?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  fieldProps?: React.ComponentProps<typeof Field>;
}

export function TimeField({ label, description, min, max, disabled, fieldProps }: TimeFieldProps) {
  const field = useFieldContext<string>();
  const { isValid, errors } = field.state.meta;
  const { hour, minute } = splitTime(field.state.value ?? '');
  const bounds = { min, max };

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <div className='flex items-center gap-2'>
        <Select value={hour} onValueChange={(h) => field.handleChange(joinTime(h, minute))} disabled={disabled}>
          <SelectTrigger id={field.name} aria-invalid={!isValid} className='w-full'>
            <SelectValue placeholder='HH' />
          </SelectTrigger>
          <SelectContent>
            {HOUR_OPTIONS.map((h) => (
              <SelectItem key={h} value={h} disabled={isHourDisabled(h, bounds)}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className='text-muted-foreground'>:</span>
        <Select value={minute} onValueChange={(m) => field.handleChange(joinTime(hour, m))} disabled={disabled}>
          <SelectTrigger aria-invalid={!isValid} className='w-full'>
            <SelectValue placeholder='mm' />
          </SelectTrigger>
          <SelectContent>
            {MINUTE_OPTIONS.map((m) => (
              <SelectItem key={m} value={m} disabled={isMinuteDisabled(m, hour, bounds)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!isValid && (
        <FieldError
          className='text-xs text-left'
          errors={errors.map((error) => ({ message: typeof error === 'string' ? error : error?.message }))}
        />
      )}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
```

- [ ] **Step 2: Update the validation example to use direct `min`/`max` props**

In `packages/registry/items/tanstack-form/time-field/validation.example.tsx`, the `children` render (lines 48-54) currently passes `props={{ min: BUSINESS_OPEN, max: BUSINESS_CLOSE }}`. Replace that block:

```tsx
        children={(field) => (
          <field.TimeField
            label='Appointment'
            description={`Office hours: ${BUSINESS_OPEN} – ${BUSINESS_CLOSE}`}
            min={BUSINESS_OPEN}
            max={BUSINESS_CLOSE}
          />
        )}
```

- [ ] **Step 3: Rewrite the doc page**

Replace the entire contents of `packages/registry/items/tanstack-form/time-field/index.mdx`:

````mdx
---
title: Time Field
description: Time picker (HH:mm) integrated with TanStack Form via field context. Two shadcn Select inputs for hours and minutes.
registryName: tsf-time-field
---

`TimeField` is a time-only picker built from two shadcn/ui `Select` inputs — hours `00`–`23` and minutes in 5-minute steps. It binds to a `string` in the `HH:mm` 24-hour format and reads its state from TanStack Form's field context.

#### Built-in features

- **Two-select picker**: hours and minutes as shadcn `Select` inputs — consistent styling, full keyboard support
- **Field-context binding**: reads value and validation state via `useFieldContext`
- **Range constraints**: pass `min` / `max` (as `HH:mm` strings) to disable out-of-range options
- **Validation**: surfaces TanStack Form validator errors below the picker

## Setup

Register the field component on your form hook, then render it inside `form.AppField`:

```tsx
import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { TimeField } from '@/components/ui/shuip/tanstack-form/time-field';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TimeField },
  formComponents: {},
});

<form.AppField
  name='meetingTime'
  children={(field) => <field.TimeField label='Meeting time' />}
/>
```

The value is a `string` in `HH:mm` format (or empty string when unset). Picking only the hour or only the minute defaults the other part to `00`.

## Constraining the range

`min` and `max` accept `HH:mm` strings; out-of-range hour and minute options are disabled:

```tsx
<field.TimeField label='Appointment' min='09:00' max='18:00' />
```

import { TypeTable } from 'fumadocs-ui/components/type-table';

## Examples

<ItemExamples registryName={'tsf-time-field'} />

## Props

<TypeTable
  type={{
    label: {
      description: 'Field label text',
      type: 'string?',
    },
    description: {
      description: 'Helper text displayed below the picker',
      type: 'string?',
    },
    min: {
      description: 'Earliest selectable time as a HH:mm string. Out-of-range options are disabled.',
      type: 'string?',
    },
    max: {
      description: 'Latest selectable time as a HH:mm string. Out-of-range options are disabled.',
      type: 'string?',
    },
    disabled: {
      description: 'Disables both selects',
      type: 'boolean?',
    },
    fieldProps: {
      description: 'Props forwarded to the wrapping Field element',
      type: 'React.ComponentProps<typeof Field>?',
    },
  }}
/>
````

- [ ] **Step 4: Generate and verify dependencies**

Run: `bun registry:generate`
Expected: no warnings.

Run: `grep -A14 '"name": "tsf-time-field"' packages/registry/registry.json`
Expected: `registryDependencies` is exactly `["field", "select", "time", "tsf-form-context"]`.

- [ ] **Step 5: Build the served registry**

Run: `bun registry:build`
Expected: `apps/docs/public/r/tsf-time-field.json` updated.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/items/tanstack-form/time-field apps/docs/public/r/tsf-time-field.json
git commit -m "refactor(tsf-time-field)!: replace native input with Select picker (HH:mm)"
```

---

## Task 5: Create `rhf-time-range`

**Files:**
- Create: `packages/registry/items/react-hook-form/time-range/component.tsx`
- Create: `packages/registry/items/react-hook-form/time-range/default.example.tsx`
- Create: `packages/registry/items/react-hook-form/time-range/index.mdx`

- [ ] **Step 1: Write the component**

Create `packages/registry/items/react-hook-form/time-range/component.tsx`:

```tsx
'use client';

import type { Lens } from '@hookform/lenses';
import { useController } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  type TimeRangeValue,
  addOneHour,
  isHourDisabled,
  isMinuteDisabled,
  joinTime,
  nextSlot,
  splitTime,
} from '@/lib/time';

interface TimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  disabled?: boolean;
  invalid?: boolean;
}

function TimePicker({ id, value, onChange, min, disabled, invalid }: TimePickerProps) {
  const { hour, minute } = splitTime(value);
  const bounds = { min };

  return (
    <div className='flex items-center gap-2'>
      <Select value={hour} onValueChange={(h) => onChange(joinTime(h, minute))} disabled={disabled}>
        <SelectTrigger id={id} aria-invalid={invalid} className='w-full'>
          <SelectValue placeholder='HH' />
        </SelectTrigger>
        <SelectContent>
          {HOUR_OPTIONS.map((h) => (
            <SelectItem key={h} value={h} disabled={isHourDisabled(h, bounds)}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className='text-muted-foreground'>:</span>
      <Select value={minute} onValueChange={(m) => onChange(joinTime(hour, m))} disabled={disabled}>
        <SelectTrigger aria-invalid={invalid} className='w-full'>
          <SelectValue placeholder='mm' />
        </SelectTrigger>
        <SelectContent>
          {MINUTE_OPTIONS.map((m) => (
            <SelectItem key={m} value={m} disabled={isMinuteDisabled(m, hour, bounds)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export interface TimeRangeFieldProps {
  lens: Lens<TimeRangeValue>;
  label?: string;
  description?: string;
  startLabel?: string;
  endLabel?: string;
  disabled?: boolean;
}

export function TimeRangeField({
  lens,
  label,
  description,
  startLabel = 'Start',
  endLabel = 'End',
  disabled,
}: TimeRangeFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const value: TimeRangeValue = field.value ?? { start: '', end: '' };

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <div className='flex flex-1 flex-col gap-1'>
          <FieldLabel htmlFor={`${field.name}-start`} className='text-xs'>
            {startLabel}
          </FieldLabel>
          <TimePicker
            id={`${field.name}-start`}
            value={value.start}
            onChange={(start) => field.onChange({ start, end: addOneHour(start) })}
            disabled={disabled}
            invalid={fieldState.invalid}
          />
        </div>
        <div className='flex flex-1 flex-col gap-1'>
          <FieldLabel htmlFor={`${field.name}-end`} className='text-xs'>
            {endLabel}
          </FieldLabel>
          <TimePicker
            id={`${field.name}-end`}
            value={value.end}
            onChange={(end) => field.onChange({ ...value, end })}
            min={value.start ? nextSlot(value.start) : undefined}
            disabled={disabled}
            invalid={fieldState.invalid}
          />
        </div>
      </div>
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
```

- [ ] **Step 2: Write the default example**

Create `packages/registry/items/react-hook-form/time-range/default.example.tsx`:

```tsx
'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { TimeRangeField } from '@/components/ui/shuip/react-hook-form/time-range';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const zodSchema = z
  .object({
    slot: z.object({
      start: z.string(),
      end: z.string(),
    }),
  })
  .refine((values) => Boolean(values.slot.start && values.slot.end && values.slot.start < values.slot.end), {
    message: 'Select a start and end time (end after start)',
    path: ['slot'],
  });

type Values = z.infer<typeof zodSchema>;

export default function RhfTimeRangeExample() {
  const form = useForm<Values>({
    defaultValues: { slot: { start: '', end: '' } },
    resolver: zodResolver(zodSchema),
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    try {
      alert(`From ${values.slot.start} to ${values.slot.end}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <TimeRangeField lens={lens.focus('slot')} label='Meeting slot' description='Pick a start and end time' />
        <SubmitButton>Save</SubmitButton>
      </form>
    </Form>
  );
}
```

- [ ] **Step 3: Write the doc page**

Create `packages/registry/items/react-hook-form/time-range/index.mdx`:

````mdx
---
title: Time Range
description: Start/end time range (HH:mm) integrated with React Hook Form via typed lens binding. Selecting the start sets the end one hour later and enforces start < end.
registryName: rhf-time-range
---

`TimeRangeField` is two coupled time pickers — a start and an end — bound to a single `{ start, end }` object via a typed lens from [`@hookform/lenses`](https://github.com/react-hook-form/lenses). Both values are `HH:mm` strings.

#### Built-in features

- **Coupled pickers**: choosing a start time sets the end to one hour later automatically
- **`start < end` enforced**: end options at or before the start are disabled in the dropdowns
- **Single object binding**: `lens.focus('slot')` binds the whole `{ start, end }` value
- **Zod validation**: refine the object to require a valid ordered range

## Setup

```tsx
import { useLens } from '@hookform/lenses';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { TimeRangeField } from '@/components/ui/shuip/react-hook-form/time-range';

type MyForm = { slot: { start: string; end: string } };

const form = useForm<MyForm>({ defaultValues: { slot: { start: '', end: '' } } });
const lens = useLens({ control: form.control });

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <TimeRangeField lens={lens.focus('slot')} label='Meeting slot' />
  </form>
</Form>
```

The value is `{ start: string; end: string }`, each a `HH:mm` string (empty when unset). Changing the start always resets the end to one hour after the new start.

import { TypeTable } from 'fumadocs-ui/components/type-table';

## Examples

<ItemExamples registryName={'rhf-time-range'} />

## Props

<TypeTable
  type={{
    lens: {
      description: 'Typed lens from useLens, bound to a { start, end } object of HH:mm strings.',
      type: 'Lens<{ start: string; end: string }>',
    },
    label: {
      description: 'Field label text',
      type: 'string?',
    },
    description: {
      description: 'Helper text displayed below the pickers',
      type: 'string?',
    },
    startLabel: {
      description: 'Label above the start picker',
      type: "string? (default 'Start')",
    },
    endLabel: {
      description: 'Label above the end picker',
      type: "string? (default 'End')",
    },
    disabled: {
      description: 'Disables all selects',
      type: 'boolean?',
    },
  }}
/>
````

- [ ] **Step 4: Generate and verify**

Run: `bun registry:generate`
Expected: `[generate]` count increased by 1, no warnings.

Run: `grep -A18 '"name": "rhf-time-range"' packages/registry/registry.json`
Expected: `registryDependencies` is exactly `["field", "select", "time"]`; `dependencies` includes `@hookform/lenses` and `react-hook-form`.

- [ ] **Step 5: Build the served registry**

Run: `bun registry:build`
Expected: `apps/docs/public/r/rhf-time-range.json` created.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/items/react-hook-form/time-range apps/docs/public/r/rhf-time-range.json
git commit -m "feat(rhf-time-range): add start/end HH:mm picker bound via lens"
```

---

## Task 6: Create `tsf-time-range`

**Files:**
- Create: `packages/registry/items/tanstack-form/time-range/component.tsx`
- Create: `packages/registry/items/tanstack-form/time-range/default.example.tsx`
- Create: `packages/registry/items/tanstack-form/time-range/index.mdx`

- [ ] **Step 1: Write the component**

Create `packages/registry/items/tanstack-form/time-range/component.tsx`:

```tsx
'use client';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';
import {
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  type TimeRangeValue,
  addOneHour,
  isHourDisabled,
  isMinuteDisabled,
  joinTime,
  nextSlot,
  splitTime,
} from '@/lib/time';

interface TimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  disabled?: boolean;
  invalid?: boolean;
}

function TimePicker({ id, value, onChange, min, disabled, invalid }: TimePickerProps) {
  const { hour, minute } = splitTime(value);
  const bounds = { min };

  return (
    <div className='flex items-center gap-2'>
      <Select value={hour} onValueChange={(h) => onChange(joinTime(h, minute))} disabled={disabled}>
        <SelectTrigger id={id} aria-invalid={invalid} className='w-full'>
          <SelectValue placeholder='HH' />
        </SelectTrigger>
        <SelectContent>
          {HOUR_OPTIONS.map((h) => (
            <SelectItem key={h} value={h} disabled={isHourDisabled(h, bounds)}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className='text-muted-foreground'>:</span>
      <Select value={minute} onValueChange={(m) => onChange(joinTime(hour, m))} disabled={disabled}>
        <SelectTrigger aria-invalid={invalid} className='w-full'>
          <SelectValue placeholder='mm' />
        </SelectTrigger>
        <SelectContent>
          {MINUTE_OPTIONS.map((m) => (
            <SelectItem key={m} value={m} disabled={isMinuteDisabled(m, hour, bounds)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export interface TimeRangeFieldProps {
  label?: string;
  description?: string;
  startLabel?: string;
  endLabel?: string;
  disabled?: boolean;
  fieldProps?: React.ComponentProps<typeof Field>;
}

export function TimeRangeField({
  label,
  description,
  startLabel = 'Start',
  endLabel = 'End',
  disabled,
  fieldProps,
}: TimeRangeFieldProps) {
  const field = useFieldContext<TimeRangeValue>();
  const { isValid, errors } = field.state.meta;
  const value: TimeRangeValue = field.state.value ?? { start: '', end: '' };

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <div className='flex flex-1 flex-col gap-1'>
          <FieldLabel htmlFor={`${field.name}-start`} className='text-xs'>
            {startLabel}
          </FieldLabel>
          <TimePicker
            id={`${field.name}-start`}
            value={value.start}
            onChange={(start) => field.handleChange({ start, end: addOneHour(start) })}
            disabled={disabled}
            invalid={!isValid}
          />
        </div>
        <div className='flex flex-1 flex-col gap-1'>
          <FieldLabel htmlFor={`${field.name}-end`} className='text-xs'>
            {endLabel}
          </FieldLabel>
          <TimePicker
            id={`${field.name}-end`}
            value={value.end}
            onChange={(end) => field.handleChange({ ...value, end })}
            min={value.start ? nextSlot(value.start) : undefined}
            disabled={disabled}
            invalid={!isValid}
          />
        </div>
      </div>
      {!isValid && (
        <FieldError
          className='text-xs text-left'
          errors={errors.map((error) => ({ message: typeof error === 'string' ? error : error?.message }))}
        />
      )}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
```

- [ ] **Step 2: Write the default example**

Create `packages/registry/items/tanstack-form/time-range/default.example.tsx`:

```tsx
'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';
import { TimeRangeField } from '@/components/ui/shuip/tanstack-form/time-range';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TimeRangeField },
  formComponents: { SubmitButton },
});

export default function TsfTimeRangeExample() {
  const form = useAppForm({
    defaultValues: {
      slot: { start: '', end: '' },
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <form.AppField
        name='slot'
        validators={{
          onChange: ({ value }) =>
            value.start && value.end && value.start < value.end
              ? undefined
              : 'Select a start and end time (end after start)',
        }}
        children={(field) => <field.TimeRangeField label='Meeting slot' description='Pick a start and end time' />}
      />

      <form.AppForm>
        <form.SubmitButton>Save</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
```

- [ ] **Step 3: Write the doc page**

Create `packages/registry/items/tanstack-form/time-range/index.mdx`:

````mdx
---
title: Time Range
description: Start/end time range (HH:mm) integrated with TanStack Form via field context. Selecting the start sets the end one hour later and enforces start < end.
registryName: tsf-time-range
---

`TimeRangeField` is two coupled time pickers — a start and an end — reading a single `{ start, end }` object from TanStack Form's field context. Both values are `HH:mm` strings.

#### Built-in features

- **Coupled pickers**: choosing a start time sets the end to one hour later automatically
- **`start < end` enforced**: end options at or before the start are disabled in the dropdowns
- **Single object binding**: bind the field to a `{ start, end }` value
- **Validation**: surfaces TanStack Form validator errors below the pickers

## Setup

```tsx
import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { TimeRangeField } from '@/components/ui/shuip/tanstack-form/time-range';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TimeRangeField },
  formComponents: {},
});

// defaultValues: { slot: { start: '', end: '' } }
<form.AppField
  name='slot'
  children={(field) => <field.TimeRangeField label='Meeting slot' />}
/>
```

The value is `{ start: string; end: string }`, each a `HH:mm` string (empty when unset). Changing the start always resets the end to one hour after the new start.

import { TypeTable } from 'fumadocs-ui/components/type-table';

## Examples

<ItemExamples registryName={'tsf-time-range'} />

## Props

<TypeTable
  type={{
    label: {
      description: 'Field label text',
      type: 'string?',
    },
    description: {
      description: 'Helper text displayed below the pickers',
      type: 'string?',
    },
    startLabel: {
      description: 'Label above the start picker',
      type: "string? (default 'Start')",
    },
    endLabel: {
      description: 'Label above the end picker',
      type: "string? (default 'End')",
    },
    disabled: {
      description: 'Disables all selects',
      type: 'boolean?',
    },
    fieldProps: {
      description: 'Props forwarded to the wrapping Field element',
      type: 'React.ComponentProps<typeof Field>?',
    },
  }}
/>
````

- [ ] **Step 4: Generate and verify**

Run: `bun registry:generate`
Expected: count increased by 1, no warnings.

Run: `grep -A14 '"name": "tsf-time-range"' packages/registry/registry.json`
Expected: `registryDependencies` is exactly `["field", "select", "time", "tsf-form-context"]`.

- [ ] **Step 5: Build the served registry**

Run: `bun registry:build`
Expected: `apps/docs/public/r/tsf-time-range.json` created.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/items/tanstack-form/time-range apps/docs/public/r/tsf-time-range.json
git commit -m "feat(tsf-time-range): add start/end HH:mm picker bound via field context"
```

---

## Task 7: Full end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Regenerate everything from scratch**

Run: `bun registry:generate`
Expected: `[generate] N items processed` (N = previous + 5: `time` + two ranges; the two time-fields were already counted). No `skipping` warnings.

- [ ] **Step 2: Confirm all five items and their dependencies**

Run:
```bash
node -e "const r=require('./packages/registry/registry.json'); for (const n of ['time','rhf-time-field','tsf-time-field','rhf-time-range','tsf-time-range']) { const it=r.items.find(i=>i.name===n); console.log(n, it ? (it.type+' '+JSON.stringify(it.registryDependencies||[])) : 'MISSING'); }"
```
Expected:
```
time registry:lib []
rhf-time-field registry:ui ["field","select","time"]
tsf-time-field registry:ui ["field","select","time","tsf-form-context"]
rhf-time-range registry:ui ["field","select","time"]
tsf-time-range registry:ui ["field","select","time","tsf-form-context"]
```

- [ ] **Step 3: Confirm the lib item installs to `lib/time.ts`**

Run: `node -e "const r=require('./packages/registry/registry.json'); console.log(JSON.stringify(r.items.find(i=>i.name==='time').files,null,2))"`
Expected: a single file with `"target": "./lib/time.ts"` and `"type": "registry:lib"`.

- [ ] **Step 4: Full docs build (proves buildIndexTs + Next compile)**

Run: `bun build:docs`
Expected: completes without error. Specifically the `__index__.ts` generation does not include a `lib/time/component` import (lib items are skipped), and Next compiles the new examples resolving `@/lib/time`.

- [ ] **Step 5: Lint clean**

Run: `bun check`
Expected: Biome reports no errors.

- [ ] **Step 6: Commit any remaining built artifacts**

```bash
git status --short
# add only tracked, changed files under apps/docs/public/r/ if any remain
git add apps/docs/public/r
git commit -m "chore(registry): rebuild served registry for time items" || echo "nothing to commit"
```

---

## Self-Review notes

- **Spec coverage:** `lib/time` API (Task 2) ✓; Select picker for both time-fields (Tasks 3-4) ✓; min/max disabling kept (Task 3-4, `isHourDisabled`/`isMinuteDisabled`) ✓; time-range with `start+1h` and `start<end` (Tasks 5-6, `addOneHour` + `nextSlot` min) ✓; generator `lib` category + tsconfig (Task 1) ✓; docs/examples (Tasks 3-6) ✓; verification (Task 7) ✓; tests out of scope (#53) ✓.
- **Type consistency:** `TimeRangeValue = { start, end }` used identically across `lib/time`, both range components and examples. Helper names (`splitTime`, `joinTime`, `addOneHour`, `nextSlot`, `isHourDisabled`, `isMinuteDisabled`) match between Task 2 and Tasks 3-6.
- **Accepted edge case:** `start = 23:55` → `nextSlot` clamps to `23:59`, disabling every end option (documented).
