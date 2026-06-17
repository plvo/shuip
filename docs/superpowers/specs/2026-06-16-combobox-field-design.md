# Combobox Field — Design

**Date:** 2026-06-16
**Branch:** `feat/combobox-field`
**Status:** Approved

## Goal

Add a searchable combobox field to the shuip registry: a command-style search
input (magnifier + result menu) where the user types to search, navigates results
with the keyboard, and selects one (or several) entries. The committed form value
is the selected option's **`value` (an id/key), distinct from the displayed
`label`** — the entity-combobox pattern ("Famille B"): the value is a stable id,
the label is for display only.

It is distinct from:
- `autocomplete-field` — free text, the committed value **is** the typed string,
  suggestions only propose ("Famille A").
- `select-field` — static dropdown, no search.
- `address-field` — Google Places specialised autocomplete.

A non-empty default form value (an id) renders its label immediately, via a
`defaultSelected` prop supplied by the consumer (the component only has the id;
the label lives with the consumer's data).

## Items

Two published items (one per form integration), following the existing `rhf-`/`tsf-`
pair convention:

- `packages/registry/items/react-hook-form/combobox-field/`
- `packages/registry/items/tanstack-form/combobox-field/`

Single and multi-select are **one component per form lib**, switched by a
`multiple` prop (not separate items). This matches react-select / MUI / shadcn and
keeps the registry lean; the cost is conditional value typing (`string` vs
`string[]`), handled by a discriminated props union (rhf) and a documented field
type (tsf).

### Structure decision: full duplication

The search / async / keyboard / chips / label-cache core is duplicated between the
rhf and tsf `component.tsx`; only the form binding differs
(`useController(lens.interop())` vs `useFieldContext`). This is accepted
deliberately, exactly as for `autocomplete-field`:

- It honours the registry's self-containment guarantee — `shadcn add
  rhf-combobox-field` installs one complete, working file.
- A shared headless base item (`dependsOn`) would force consumers to install two
  items. Rejected for now (YAGNI); revisit only if a third consumer of the core
  appears.

## Option type

```ts
interface ComboboxOption {
  value: string;     // committed to the form
  label: string;     // displayed in the input / chips / list
  sublabel?: string; // optional secondary line in the result list
}
```

The consumer maps its own data (tRPC rows, etc.) to `ComboboxOption[]` inside
`options` or the `onSearch` resolver — the component never owns the data shape.

## Behaviour

### Value semantics (Famille B)

- Committed value is the option's `value` (id): `string` in single mode, `string[]`
  in multi mode.
- The component keeps an internal **option cache** (`Map<value, ComboboxOption>`),
  seeded from `defaultSelected`, so a selected option's `label` keeps rendering even
  after it leaves the live search results. This is what lets a preset default id
  show its label at rest.

### Single mode

- At rest (not focused): the input displays the selected option's `label`, or the
  placeholder when empty.
- On focus: the input pre-fills the current `label` as **selected text** (so the
  first keystroke replaces it) and opens the menu showing the **full list** with the
  current option checked. The filter query stays empty until the user actually types
  — pre-filled-but-untouched is treated as an empty query (so `onSearch('')` still
  drives the "recents" list).
- Typing replaces the selected label and filters; selecting an option (click or
  `Enter`) commits its `value`, closes the menu, and the input shows the new label.
- Closing without typing/selecting (blur / `Escape`) keeps the previously committed
  value and restores its label.

### Multi mode

- Selected options render as **chips** (the `badge` primitive) inside the field
  container, after the magnifier and before the query input.
- Selecting an option appends its `value`; the menu **stays open** so several can
  be picked in a row. Already-selected options show a check and toggle off when
  re-selected.
- `Backspace` on an empty query removes the last chip.
- The committed value is the ordered `string[]` of selected ids.
- The container is `w-full` + `flex-wrap` with a `min-w-0` input, so chips wrap onto
  new lines and never widen the field past its container.

### Search modes (mutually exclusive)

- **Static** — `options: ComboboxOption[]`. Client-side substring filter on
  `label`, case-insensitive.
- **Async** — `onSearch: (query) => Promise<ComboboxOption[]>`. Debounced (default
  300ms) fetch; results shown as-is (server already filtered). A stale-response
  guard (`requestIdRef`) drops out-of-order responses; a `Loader2` spinner shows
  while pending.
- If both are passed, `onSearch` wins.

### Default options on open

When the menu opens with an empty query, `onSearch('')` is invoked (no debounce) so
the consumer can return a "recent / suggested" list — e.g. the 5 last-modified
clients — instead of an empty menu. The consumer branches on the query:
`(q) => q ? api.search(q) : api.recent()`. No dedicated prop; `maxResults` caps the
display. (Static mode shows `options` directly on open.)

### maxResults

`maxResults?: number` slices the result list before render (applies to both static
and async results, and to the default-on-open list).

### Empty / loading

- `emptyText` (default `"No results"`) when a non-empty query yields nothing.
- `"Searching…"` while an async request is pending.

## Interaction implementation

cmdk-native combobox — **no Radix `Popover`**. A Radix `Popover` treats a click on
its anchor (the field, which lives outside `PopoverContent`) as an outside-interaction
and closes, while the input keeps focus — so `onFocus` never re-fires and the field
gets stuck until a blur + re-click. Dropping the `Popover` removes that conflict at
the root.

- One `<Command shouldFilter={false}>` wraps:
  - a styled **shell** `<div>` laid out as `magnifier (always left) · chips (multi) ·
    input`. The input is cmdk's raw `CommandPrimitive.Input` (no built-in icon
    wrapper) so the magnifier position is fully ours; a `lucide` `Search` icon is
    rendered explicitly at the far left.
  - a **floating list** (`absolute`, `top-full`, `z-50`, `w-full`, bordered
    `bg-popover`) rendered only when `open`, containing `CommandList` / `CommandEmpty`
    / `CommandGroup` / `CommandItem`.
- Open/close: open on input `focus` / `pointerdown`; close on input `blur` when
  `relatedTarget` is outside the `Command` container, on `Escape`, and (single only)
  on select. The list uses `onMouseDown` `preventDefault` so clicking an item /
  chip-remove does not blur the input and pre-empt the select.
- cmdk owns `ArrowUp` / `ArrowDown` / `Enter` navigation over the rendered
  `CommandItem`s (no manual `selectedIndex`). `Escape` and multi `Backspace` are
  handled on the input's `onKeyDown`.
- Trade-off vs `Popover`: no automatic flip near the viewport edge — the list always
  opens downward with an internal `max-h-60` scroll. Acceptable for now.
- `CommandItem` renders `label` + optional `sublabel`, with a `Check` for selected
  values.

## Variants

Two independent axes, applied to the shell via plain class maps (the `inline-edit`
pattern), valid in both single and multi:

- `variant: 'boxed' | 'ghost'` (default `boxed`). `boxed` = bordered field with
  focus ring; `ghost` = borderless, transparent background (multi then reads as just
  the badges + magnifier).
- `size: 'sm' | 'default'` (default `default`). `sm` reduces height, padding, text
  and icon sizes.

## Props

### RHF — `ComboboxFieldProps`

```ts
interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

type ComboboxFieldCommonProps = {
  options?: ComboboxOption[];
  onSearch?: (query: string) => Promise<ComboboxOption[]>;
  maxResults?: number;
  variant?: 'boxed' | 'ghost'; // default "boxed"
  size?: 'sm' | 'default';     // default "default"
  label?: string;
  description?: string;
  placeholder?: string;
  emptyText?: string;   // default "No results"
  debounceMs?: number;  // default 300, async mode only
};

type ComboboxFieldProps =
  | (ComboboxFieldCommonProps & {
      multiple?: false;
      lens: Lens<string>;
      defaultSelected?: ComboboxOption;
    })
  | (ComboboxFieldCommonProps & {
      multiple: true;
      lens: Lens<string[]>;
      defaultSelected?: ComboboxOption[];
    });
```

Binding: `const { field, fieldState } = useController(lens.interop());`,
`aria-invalid={fieldState.invalid}`, errors via `<FieldError errors={[fieldState.error]} />`.

### TSF — `ComboboxFieldProps`

Same logic and feature set. Differences follow the tsf field convention:

- No `lens`; binding via `useFieldContext<string>()` (single) /
  `useFieldContext<string[]>()` (multi). The consumer declares the field value type;
  the component reads/writes `field.state.value` and normalises internally to a
  `string[]` working set.
- `multiple`, `options`, `onSearch`, `defaultSelected`, `maxResults`, `label`,
  `description`, `placeholder`, `emptyText`, `debounceMs` are top-level on the props
  object; input/field passthrough nested under
  `props?: React.ComponentProps<'input'>` and
  `fieldProps?: React.ComponentProps<typeof Field>`.
- Value/handlers via `field.handleChange`, `field.handleBlur`, validity/errors from
  `field.state.meta`.

## Files per item

- `component.tsx` (REQUIRED, exact name).
- `default.example.tsx` — single mode, static `options`, `defaultSelected` set to
  show a preset value's label.
- `multiple.example.tsx` — `multiple` with static `options` (chips).
- `async.example.tsx` — `onSearch` with a simulated async fetch + a "recents on
  empty query" branch.
- `variants.example.tsx` — `boxed` vs `ghost` (a multi `ghost` showing only badges).
- `sizes.example.tsx` — `sm` vs `default`.
- `index.mdx` — frontmatter (`title`, `description`, `registryName`),
  `<ItemExamples registryName={...} />`, and a `<TypeTable>` for props (incl.
  `variant` / `size`).

Examples import the component via the stub alias
(`@/components/ui/shuip/react-hook-form/combobox-field` /
`@/components/ui/shuip/tanstack-form/combobox-field`), never relative.

## Dependencies (auto-detected by generate.ts)

- `registryDependencies`: `command`, `field`, `badge` (chips). No `popover` (the
  cmdk-native rebuild drops it) and no `input` (the field uses cmdk's
  `CommandPrimitive.Input`, not the shadcn `Input`).
- `dependencies`: `lucide-react` (`Search`, `Check`, `Loader2`, `X`) and `cmdk`
  (`CommandPrimitive.Input`).
- RHF additionally pulls `@hookform/lenses` + `react-hook-form`; TSF pulls
  `@tanstack/react-form` and uses the `form-context` stub.

## Verification

No test runner is configured in shuip; the gate is the build pipeline:

1. `bun registry:generate` — item count +2, no `skipping … no component.tsx` warning.
2. New entries in `registry.json` with expected
   `registryDependencies`/`dependencies`.
3. Stubs at `stubs/react-hook-form/combobox-field.tsx` and
   `stubs/tanstack-form/combobox-field.tsx`; MDX symlinks under
   `content/components/react-hook-form/` and `content/components/tanstack-form/`.
4. `bun build:docs` succeeds end-to-end.
5. Manual check of the three examples: single label-at-rest, multi chips +
   backspace, async search + recents-on-open + spinner, keyboard nav, defaultSelected
   label resolution.

Adding a real unit-test setup (runner + RTL) is out of scope here — it would be a
separate infra decision.

## Out of scope (YAGNI)

- A dedicated `defaultOptions` prop (covered by `onSearch('')`).
- Creating new options on the fly (tag-style free entry).
- Grouped results / option groups.
- A shared headless base component.
- Virtualised result lists.
