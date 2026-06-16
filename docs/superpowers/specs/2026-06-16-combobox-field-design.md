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
- On focus: the input clears to an empty query and fires `onSearch('')` (see
  "Default options on open"); the result menu opens below.
- Selecting an option (click or `Enter` on the highlighted row) commits its
  `value`, closes the menu, and the input reverts to showing the label.
- Closing without selecting (blur / `Escape`) keeps the previously committed value
  and restores its label.

### Multi mode

- Selected options render as **chips** (the `badge` primitive) inside the field
  container, before the query input.
- Selecting an option appends its `value`; the menu **stays open** so several can
  be picked in a row. Already-selected options show a check and toggle off when
  re-selected.
- `Backspace` on an empty query removes the last chip.
- The committed value is the ordered `string[]` of selected ids.

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

Built on cmdk `Command` to get the command aesthetic and keyboard nav for free:

- One `<Command shouldFilter={false}>` wraps an always-visible `<CommandInput>`
  (built-in magnifier icon — this is the "command" look) and a `<CommandList>`
  rendered in a `Popover`/anchored dropdown when `open`.
- cmdk provides `ArrowUp` / `ArrowDown` / `Enter` / `Escape` navigation over the
  rendered `CommandItem`s; we do not track `selectedIndex` manually (unlike
  `autocomplete-field`, whose plain-input model required it).
- Popover width pinned to the field via `var(--radix-popover-trigger-width)`;
  `onOpenAutoFocus` prevented so focus stays in the input.
- The single-mode "label at rest vs query while focused" is handled by syncing the
  `CommandInput` displayed value to state (selected label when blurred, live query
  when focused) — the fiddly part of this component.
- `CommandItem` renders `label` + optional `sublabel`, with a `Check` for selected
  values (multi) / the active value (single).

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
- `index.mdx` — frontmatter (`title`, `description`, `registryName`),
  `<ItemExamples registryName={...} />`, and a `<TypeTable>` for props.

Examples import the component via the stub alias
(`@/components/ui/shuip/react-hook-form/combobox-field` /
`@/components/ui/shuip/tanstack-form/combobox-field`), never relative.

## Dependencies (auto-detected by generate.ts)

- `registryDependencies`: `command`, `popover`, `field`, `input`, `badge` (chips).
- `dependencies`: `lucide-react` (`Search`, `Check`, `Loader2`, `X`).
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
