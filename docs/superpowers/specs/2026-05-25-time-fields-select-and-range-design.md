# Time fields: Select-based picker + time range

Date: 2026-05-25
Branch: `feat/time-field`

## Goal

Two outcomes on this PR:

1. Replace the native browser time picker (`<input type="time">`) in the existing
   `rhf-time-field` and `tsf-time-field` with a shadcn `Select`-based picker: two
   selects, hours `00`–`23` and minutes in 5-minute steps (`00, 05, …, 55`).
2. Add a new `time-range` field (`rhf-time-range`, `tsf-time-range`) — two coupled
   time pickers (start / end) with automatic end management and a `start < end`
   constraint.

The pure `HH:mm` logic shared by all four fields is extracted into a new `lib/time`
registry item, which requires adding a `lib` category to the registry generator.

## Decisions

| Topic | Decision |
|-------|----------|
| Minute step | Fixed at 5 (not configurable). |
| Hour range | `00`–`23` (24-hour). |
| `min` / `max` on time-field | Kept. Out-of-range hour/minute options are **disabled** (greyed), not removed. |
| Range gap behaviour | Changing `start` always sets `end = start + 1h` (clamped to end of day). |
| `start < end` enforcement | Disable invalid options in the `end` picker + auto-correct, reusing the `min`/`max` disable helpers with `min = nextSlot(start)`. |
| Partial selection | Picking only one of hour/minute defaults the other to `00` (via `joinTime`). |
| Value format (time-field) | `string` `"HH:mm"` (or `""` unset) — unchanged, so existing bindings, Zod schemas and examples keep working. |
| Value format (time-range) | `{ start: string; end: string }`, bound via a single controller on the object. |
| Shared logic location | New `lib/time` registry item, installs to `lib/time.ts`, imported as `@/lib/time`. |
| Tests | None on this PR (no runner configured). Tracked in issue #53. |

### Accepted edge case

`start = 23:55` leaves no valid `end` slot (every later option is disabled). Accepted
for v1; not worth special-casing.

## Architecture

Pure logic lives in one shared `lib` item; each form field renders its own (small)
Select markup inline and consumes the shared helpers. This mirrors shadcn's own ethos
(share tiny utils like `cn`, inline the composition) and keeps "what you install is
what you read".

The generator already auto-wires shared internal items as `registryDependencies` when
imported (the `tsf-form-context` pattern). The same mechanism applies to `@/lib/time`
once a `lib` category exists.

### Items

| Item | Status | Role |
|------|--------|------|
| `lib/time` | new | Pure `HH:mm` logic. No JSX, no npm deps. |
| `react-hook-form/time-field` | modified | Two `Select`s bound via lens. |
| `tanstack-form/time-field` | modified | Two `Select`s bound via field context. |
| `react-hook-form/time-range` | new | start/end, bound via lens on `{start,end}`. |
| `tanstack-form/time-range` | new | start/end, bound via field context. |

### `lib/time` public API

```ts
export const MINUTE_STEP = 5;
export const HOUR_OPTIONS: string[];    // ["00".."23"]
export const MINUTE_OPTIONS: string[];  // ["00","05",..,"55"]
export type TimeRangeValue = { start: string; end: string };

splitTime(time: string): { hour: string; minute: string };   // "" -> {"",""}
joinTime(hour: string, minute: string): string;              // defaults missing part to "00"; "" if both empty
toMinutes(time: string): number | null;                      // null if empty/invalid
fromMinutes(total: number): string;                          // clamp [0,1439], zero-padded "HH:mm"
addOneHour(time: string): string;                            // end = start + 1h, clamped to 23:55
nextSlot(time: string): string;                              // time + MINUTE_STEP
isHourDisabled(hour: string, bounds?: { min?: string; max?: string }): boolean;
isMinuteDisabled(minute: string, hour: string, bounds?: { min?: string; max?: string }): boolean;
```

`isHourDisabled` / `isMinuteDisabled` serve both constraints:

- `time-field` passes its `min` / `max` props (business hours).
- `time-range` passes `min = nextSlot(start)` to the `end` picker, which enforces
  `start < end` through the exact same code path.

### time-field (rhf + tsf)

- Two `Select`s side by side (hour, minute). Value stays a `"HH:mm"` string.
- `min` / `max` kept; out-of-range options disabled.
- Resulting `registryDependencies`: `field`, `select`, `time` (drops `input-group`).

### time-range (rhf + tsf)

- Value `{ start, end }`, single controller (rhf: `useController(lens.interop())`;
  tsf: `useFieldContext<TimeRangeValue>()`).
- On `start` change: `end = addOneHour(start)`.
- `end` picker: options `<= start` disabled (`min = nextSlot(start)`).
- `registryDependencies`: `field`, `select`, `time`.

## Generator changes (`packages/registry/scripts/generate.ts`)

1. `CATEGORIES`: add `lib: { itemType: 'registry:lib', targetPath: './lib' }`; widen
   the `itemType` config type to include `registry:lib`.
2. `categoryToType`: add `registry:lib` to the return type.
3. `computeTarget`: emit `.ts` for `lib` (vs `.tsx` elsewhere) → `./lib/time.ts`.
4. `scanItems`: for `lib`, the main file is `<name>.ts` (e.g. `time.ts`), not
   `component.tsx` — no fake component file in the source tree.
5. New `parseLibDeps`: `@/lib/<name>` (excluding `utils`) → a `lib` item dependency,
   merged into `registryDependencies`.
6. `buildIndexTs` and stub generation: **skip** `lib` items (no React preview, no
   stub — they are imported via `@/lib/*`, not the shuip alias).

## tsconfig path mapping

Add the glob `@/lib/*` → `items/lib/*/<name>` in **both** `packages/registry/tsconfig.json`
and `apps/docs/tsconfig.json`. The existing exact `@/lib/utils` mapping stays (more
specific pattern wins), so `cn` resolution is unaffected.

## Docs / examples

- `time-field` (rhf + tsf): update `default.example` and `validation.example` (still
  valid — value is still a `"HH:mm"` string and `min`/`max` are kept); rewrite the
  "native browser picker" section of `index.mdx` to describe the Select-based picker.
- `time-range` (rhf + tsf): new `default.example` and `index.mdx`.
- `lib/time`: no `index.mdx`, no example (internal plumbing, like `tsf-form-context`).

## Verification

Given the registry's silent-failure class, after implementing:

1. `bun registry:generate`, then inspect `registry.json`:
   - `time` is emitted as `registry:lib` with target `./lib/time.ts`.
   - The four form fields list `"time"` in their `registryDependencies`.
2. `bun build:docs`: confirms `buildIndexTs` does not choke on the non-component `lib`
   item and that `apps/docs/public/r/*.json` is correct.
3. `bun check` (Biome) clean.

## Out of scope

- Test runner setup and unit tests for `lib/time.ts` — tracked in issue #53.
- `min` / `max` (business hours) on the time-range — `start < end` suffices for v1.
- Seconds granularity.
