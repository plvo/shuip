# Autocomplete Field — Design

**Date:** 2026-05-25
**Branch:** `feat/input-autocomplete`
**Status:** Approved

## Goal

Add a string autocomplete field to the shuip registry: a free-text input that
suggests matching values from a list as the user types. The committed form value
is a plain `string` — the suggestion list only proposes, it never restricts. This
matches the "Famille A" pattern already used across the user's projects
(`StringAutocompleteField` in agence-nuisibles-crm and kodex).

It is distinct from:
- `address-field` — autocomplete specialised for Google Places (server action).
- entity comboboxes — restrict the value to a list and store IDs ("Famille B").
- `select-field` — static dropdown, no free text entry.

## Items

Two published items (one per form integration), following the existing `rhf-`/`tsf-`
pair convention:

- `packages/registry/items/react-hook-form/autocomplete-field/`
- `packages/registry/items/tanstack-form/autocomplete-field/`

### Structure decision: full duplication (Approach A)

The presentational + interaction core (filtering, debounce, keyboard nav, popover)
is ~100 lines and is duplicated between the rhf and tsf `component.tsx`; only the
form binding (~10 lines) differs. This is heavier duplication than the existing
field pairs (~15 lines each), but it is accepted deliberately:

- It honours the registry's self-containment guarantee — `shadcn add
  rhf-autocomplete-field` installs one complete, working file.
- The alternative (a base `components/autocomplete` headless item wrapped by the
  pair via `meta.shuip.json` `dependsOn`) would add a third item and force
  consumers to install two items. Rejected for now (YAGNI); revisit only if a
  third consumer of the core appears.

## Behaviour (Famille A)

- Text input is the primary typing surface and holds the field value (free text).
- While typing, a dropdown below the input lists matching suggestions.
- Selection: click, or `ArrowDown`/`ArrowUp` + `Enter`. `Escape` closes the dropdown.
- Text outside the list is preserved — closing without selecting keeps what was typed.
- Committed value is always a `string` (what the user typed or the suggestion chosen).

### Two suggestion modes (mutually exclusive)

- **Static** — `suggestions: string[]`. Client-side substring filter, case-insensitive:
  `s.toLowerCase().includes(query.toLowerCase())`.
- **Async** — `onSearch: (query) => Promise<string[]>`. Debounced (default 300ms)
  fetch; results displayed as-is (server already filtered). A stale-response guard
  (`requestIdRef`) drops out-of-order responses. A `Loader2` spinner shows while
  the promise is pending.
- If both props are passed, `onSearch` takes precedence.

## Interaction implementation

Model on the established `address-field` pattern (the existing shuip autocomplete
precedent):

- The `Input` is the `PopoverTrigger`; `onOpenAutoFocus` is prevented so focus
  stays in the input while the popover is open.
- `Popover` width pinned to the trigger via `var(--radix-popover-trigger-width)`.
- `Command` with `shouldFilter={false}` (filtering is done by us, not cmdk),
  `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`.
- Manual keyboard navigation: `selectedIndex` state + `handleKeyDown`
  (ArrowDown/ArrowUp/Enter/Escape), because focus is in the outer input, not a
  `CommandInput`.
- `CommandEmpty` shows `emptyText` (default `"No results"`), or a "Searching…"
  state while async is pending.

## Props

### RHF — `AutocompleteFieldProps`

```ts
interface AutocompleteFieldProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  lens: Lens<string>;
  label?: string;
  description?: string;
  placeholder?: string;
  suggestions?: string[];
  onSearch?: (query: string) => Promise<string[]>;
  emptyText?: string;        // default "No results"
  debounceMs?: number;       // default 300, async mode only
  filter?: (suggestion: string, query: string) => boolean; // override default substring match (static mode only)
}
```

Binding: `const { field, fieldState } = useController(lens.interop());`, value
sourced from `field.value ?? ''`, `aria-invalid={fieldState.invalid}`, errors via
`<FieldError errors={[fieldState.error]} />`.

### TSF — `AutocompleteFieldProps`

Same logic and feature set. Differences follow the tsf field convention:

- No `lens`; binding via `const field = useFieldContext<string>();`.
- UI props nested under `props?: React.ComponentProps<'input'>` and
  `fieldProps?: React.ComponentProps<typeof Field>` rather than spread at the top level.
- `suggestions`, `onSearch`, `emptyText`, `debounceMs`, `filter`, `label`,
  `description`, `placeholder` remain top-level on the props object.
- Value/handlers: `field.state.value`, `field.handleChange`, `field.handleBlur`,
  validity/errors from `field.state.meta`.

## Files per item

- `component.tsx` (REQUIRED, exact name).
- `default.example.tsx` — static mode, e.g. `suggestions={['linkedin','irl','prospection']}`.
- `async.example.tsx` — `onSearch` mode with a simulated async fetch.
- `index.mdx` — frontmatter (`title`, `description`, `registryName`),
  `<ItemExamples registryName={...} />`, and a `<TypeTable>` for props
  (import `TypeTable` inline).

Examples import the component via the stub alias
(`@/components/ui/shuip/react-hook-form/autocomplete-field` /
`@/components/ui/shuip/tanstack-form/autocomplete-field`), never relative.

## Dependencies (auto-detected by generate.ts)

- `registryDependencies`: `command`, `popover`, `input`, `field` (via
  `@/components/ui/<name>` imports).
- `dependencies`: `lucide-react` (`Loader2` spinner).
- RHF additionally pulls `@hookform/lenses` + `react-hook-form`; TSF pulls
  `@tanstack/react-form` and uses the `form-context` stub.

## Verification

1. `bun registry:generate` — item count +2, no `skipping … no component.tsx` warning.
2. New entries in `registry.json` with expected `registryDependencies`/`dependencies`.
3. Stubs at `stubs/react-hook-form/autocomplete-field.tsx` and
   `stubs/tanstack-form/autocomplete-field.tsx`; MDX symlinks under
   `content/docs/react-hook-form/` and `content/docs/tanstack-form/`.
4. `bun build:docs` succeeds end-to-end.

## Out of scope (YAGNI)

- Ghost-text inline completion (considered, dropped: conflicts with substring
  matching and degrades under async).
- Multi-value / tag entry (the `SkillsTagInput` pattern).
- A shared headless base component (Approach B).
- Restricting the value to the list (Famille B / entity combobox).
