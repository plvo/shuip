# DataTable Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one entity-agnostic, dual-mode `data-table` block to the shuip registry, built on TanStack Table v8 + shadcn/ui primitives.

**Architecture:** A single `component.tsx` exports a generic `useDataTable<TData>` hook (auto-selects client vs server mode) plus composable sub-components (`DataTable`, `DataTableToolbar`, `DataTableColumnHeader`, `DataTableFacetedFilter`, `DataTableViewOptions`, `DataTablePagination`). All entity knowledge lives in `ColumnDef[]` + a typed `meta` extension; the components read only the `Table<TData>` instance. Three examples (client / server / rich Twenty-like) and an MDX doc with a copy-paste nuqs URL-sync recipe.

**Tech Stack:** React 19, TanStack Table v8 (`@tanstack/react-table`), Tailwind v4, shadcn/ui primitives (button, input, popover, command, select, separator, checkbox, and a new `table` primitive), lucide-react, Biome.

**No test runner exists in this repo** (the project CLAUDE.md says propose a setup before adding tests — out of scope here). Verification gates are `bun registry:generate` and `bun build:docs` (the authoritative type gate), plus manual preview checks. TDD's test cycle is therefore replaced by generate/build verification at each task.

---

### Task 1: Add the shadcn `table` primitive to `packages/ui`

**Files:**
- Create: `packages/ui/src/components/ui/table.tsx`

- [ ] **Step 1: Create the table primitive**

```tsx
'use client';

import type * as React from 'react';

import { cn } from '@/lib/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div data-slot='table-container' className='relative w-full overflow-x-auto'>
      <table data-slot='table' className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead data-slot='table-header' className={cn('[&_tr]:border-b', className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot='table-body' className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot='table-footer'
      className={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot='table-row'
      className={cn('hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors', className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot='table-head'
      className={cn(
        'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot='table-cell'
      className={cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return <caption data-slot='table-caption' className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
```

- [ ] **Step 2: Verify it typechecks in `packages/ui`**

Run: `cd packages/ui && bunx tsc --noEmit`
Expected: no errors referencing `table.tsx` (a pre-existing `baseUrl` TS5101 deprecation notice elsewhere is harmless).

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/components/ui/table.tsx
git commit -m "feat(ui): add table primitive"
```

---

### Task 2: Add `@tanstack/react-table` to the catalog and registry deps

**Files:**
- Modify: `package.json` (root `workspaces.catalog`)
- Modify: `packages/registry/package.json` (dependencies)

- [ ] **Step 1: Add the dependency to the root catalog**

In `package.json`, inside `"workspaces"."catalog"`, add this line after the `"@dnd-kit/utilities"` entry (keep valid JSON — add a comma to the previous last entry):

```json
"@tanstack/react-table": "^8.21.3"
```

- [ ] **Step 2: Reference it from the registry workspace**

In `packages/registry/package.json`, inside `"dependencies"`, add after the `"@tanstack/react-query"` line:

```json
"@tanstack/react-table": "catalog:",
```

- [ ] **Step 3: Install**

Run: `bun install`
Expected: lockfile updates, `@tanstack/react-table` resolves to the catalog version, no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json packages/registry/package.json bun.lock
git commit -m "build(deps): add @tanstack/react-table to catalog"
```

---

### Task 3: Create the data-table `component.tsx`

**Files:**
- Create: `packages/registry/items/blocks/data-table/component.tsx`

This is the whole system. It imports `@/components/ui/table` (→ auto-detected `registryDependencies: ["table"]`) and `@tanstack/react-table` (→ auto-detected `dependencies`).

- [ ] **Step 1: Write the full component**

```tsx
'use client';

import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnPinningState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  CheckIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  EyeOff,
  PlusCircle,
  Settings2,
  X,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table as TableRoot,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type DataTableFilterOption = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
};

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
    placeholder?: string;
    variant?: 'text' | 'number' | 'date' | 'select' | 'multiSelect';
    options?: DataTableFilterOption[];
    icon?: React.ComponentType<{ className?: string }>;
  }
}

export type UseDataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  pageCount?: number;
  getRowId?: (row: TData, index: number) => string;
  enableRowSelection?: boolean;
  enableColumnPinning?: boolean;
  initialState?: {
    pagination?: PaginationState;
    sorting?: SortingState;
    columnVisibility?: VisibilityState;
    columnPinning?: ColumnPinningState;
  };
  state?: {
    pagination?: PaginationState;
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    globalFilter?: string;
  };
  onPaginationChange?: OnChangeFn<PaginationState>;
  onSortingChange?: OnChangeFn<SortingState>;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  onGlobalFilterChange?: OnChangeFn<string>;
};

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    data,
    columns,
    pageCount,
    getRowId,
    enableRowSelection = false,
    enableColumnPinning = false,
    initialState,
  } = props;

  const manual = pageCount != null;

  const [sorting, setSorting] = React.useState<SortingState>(initialState?.sorting ?? []);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialState?.columnVisibility ?? {},
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState<PaginationState>(
    initialState?.pagination ?? { pageIndex: 0, pageSize: 10 },
  );
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    left: initialState?.columnPinning?.left ?? [],
    right: initialState?.columnPinning?.right ?? [],
  });

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? undefined,
    state: {
      sorting: props.state?.sorting ?? sorting,
      columnFilters: props.state?.columnFilters ?? columnFilters,
      globalFilter: props.state?.globalFilter ?? globalFilter,
      columnVisibility,
      rowSelection,
      pagination: props.state?.pagination ?? pagination,
      columnPinning,
    },
    enableRowSelection,
    enableColumnPinning,
    getRowId,
    manualPagination: manual,
    manualSorting: manual,
    manualFiltering: manual,
    onSortingChange: props.onSortingChange ?? setSorting,
    onColumnFiltersChange: props.onColumnFiltersChange ?? setColumnFilters,
    onGlobalFilterChange: props.onGlobalFilterChange ?? setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: props.onPaginationChange ?? setPagination,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    ...(manual
      ? {}
      : {
          getSortedRowModel: getSortedRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          getFacetedRowModel: getFacetedRowModel(),
          getFacetedUniqueValues: getFacetedUniqueValues(),
        }),
  });

  return { table };
}

function getPinStyles<TData>(column: Column<TData>): React.CSSProperties {
  const pinned = column.getIsPinned();
  if (!pinned) return {};
  return {
    position: 'sticky',
    left: pinned === 'left' ? column.getStart('left') : undefined,
    right: pinned === 'right' ? column.getAfter('right') : undefined,
    zIndex: 1,
  };
}

function getPinClass<TData>(column: Column<TData>): string | undefined {
  return column.getIsPinned() ? 'bg-background' : undefined;
}

export type DataTableProps<TData> = {
  table: Table<TData>;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  className?: string;
};

export function DataTable<TData>({ table, isLoading, emptyState, onRowClick, className }: DataTableProps<TData>) {
  const columnCount = table.getAllLeafColumns().length;
  const rows = table.getRowModel().rows;

  return (
    <div className={cn('rounded-md border', className)}>
      <TableRoot>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={getPinStyles(header.column)} className={getPinClass(header.column)}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: table.getState().pagination.pageSize }).map((_, rowIndex) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
              <TableRow key={rowIndex}>
                {Array.from({ length: columnCount }).map((__, cellIndex) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                  <TableCell key={cellIndex}>
                    <div className='h-5 w-full animate-pulse rounded bg-muted' />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} style={getPinStyles(cell.column)} className={getPinClass(cell.column)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columnCount} className='h-24 text-center'>
                {emptyState ?? 'No results.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableRoot>
    </div>
  );
}

export type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
};

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={className}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className={cn('-ml-3 h-8 data-[state=open]:bg-accent', className)}>
          <span>{title}</span>
          {sorted === 'desc' ? (
            <ArrowDown className='ml-2 size-4' />
          ) : sorted === 'asc' ? (
            <ArrowUp className='ml-2 size-4' />
          ) : (
            <ChevronsUpDown className='ml-2 size-4' />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='flex w-40 flex-col gap-0.5 p-1'>
        {column.getCanSort() && (
          <>
            <Button variant='ghost' size='sm' className='justify-start' onClick={() => column.toggleSorting(false)}>
              <ArrowUp className='mr-2 size-3.5 text-muted-foreground/70' /> Asc
            </Button>
            <Button variant='ghost' size='sm' className='justify-start' onClick={() => column.toggleSorting(true)}>
              <ArrowDown className='mr-2 size-3.5 text-muted-foreground/70' /> Desc
            </Button>
          </>
        )}
        {column.getCanHide() && (
          <Button variant='ghost' size='sm' className='justify-start' onClick={() => column.toggleVisibility(false)}>
            <EyeOff className='mr-2 size-3.5 text-muted-foreground/70' /> Hide
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export type DataTableFacetedFilterProps<TData, TValue> = {
  column?: Column<TData, TValue>;
  title?: string;
  options: DataTableFilterOption[];
};

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set((column?.getFilterValue() as string[]) ?? []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='h-8 border-dashed'>
          <PlusCircle className='mr-2 size-4' />
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator orientation='vertical' className='mx-2 h-4' />
              <span className='rounded-sm bg-secondary px-1 font-normal text-xs'>{selectedValues.size}</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-48 p-0' align='start'>
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) selectedValues.delete(option.value);
                      else selectedValues.add(option.value);
                      const filterValues = Array.from(selectedValues);
                      column?.setFilterValue(filterValues.length ? filterValues : undefined);
                    }}
                  >
                    <div
                      className={cn(
                        'mr-2 flex size-4 items-center justify-center rounded-sm border border-primary',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <CheckIcon className='size-3.5' />
                    </div>
                    {option.icon && <option.icon className='mr-2 size-4 text-muted-foreground' />}
                    <span>{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className='ml-auto flex size-4 items-center justify-center font-mono text-xs'>
                        {facets.get(option.value)}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => column?.setFilterValue(undefined)} className='justify-center text-center'>
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function DataTableViewOptions<TData>({ table }: { table: Table<TData> }) {
  const columns = table.getAllColumns().filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='ml-auto hidden h-8 lg:flex'>
          <Settings2 className='mr-2 size-4' /> View
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-44 p-0'>
        <Command>
          <CommandInput placeholder='Search columns...' />
          <CommandList>
            <CommandEmpty>No columns.</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => (
                <CommandItem key={column.id} onSelect={() => column.toggleVisibility(!column.getIsVisible())}>
                  <CheckIcon className={cn('mr-2 size-4', column.getIsVisible() ? 'opacity-100' : 'opacity-0')} />
                  <span className='truncate'>{column.columnDef.meta?.label ?? column.id}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  searchPlaceholder?: string;
  children?: React.ReactNode;
};

export function DataTableToolbar<TData>({ table, searchPlaceholder = 'Search...', children }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || Boolean(table.getState().globalFilter);
  const filterableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanFilter() && column.columnDef.meta?.variant);

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Input
        placeholder={searchPlaceholder}
        value={(table.getState().globalFilter as string) ?? ''}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        className='h-8 w-40 lg:w-56'
      />
      {filterableColumns.map((column) => {
        const meta = column.columnDef.meta;
        if ((meta?.variant === 'select' || meta?.variant === 'multiSelect') && meta.options) {
          return (
            <DataTableFacetedFilter
              key={column.id}
              column={column}
              title={meta.label ?? column.id}
              options={meta.options}
            />
          );
        }
        return null;
      })}
      {isFiltered && (
        <Button
          variant='ghost'
          size='sm'
          className='h-8 px-2'
          onClick={() => {
            table.resetColumnFilters();
            table.setGlobalFilter('');
          }}
        >
          Reset <X className='ml-2 size-4' />
        </Button>
      )}
      {children}
      <DataTableViewOptions table={table} />
    </div>
  );
}

export type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  pageSizeOptions?: number[];
};

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
}: DataTablePaginationProps<TData>) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-4'>
      <div className='text-muted-foreground text-sm'>
        {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className='flex flex-wrap items-center gap-4 lg:gap-6'>
        <div className='flex items-center gap-2'>
          <p className='font-medium text-sm'>Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className='h-8 w-[72px]'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center font-medium text-sm'>
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon-sm'
            className='hidden lg:flex'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className='size-4' />
          </Button>
          <Button variant='outline' size='icon-sm' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            className='hidden lg:flex'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className='size-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit** (full verification happens in Task 8 after generate)

```bash
git add packages/registry/items/blocks/data-table/component.tsx
git commit -m "feat(data-table): add entity-agnostic data-table block component"
```

---

### Task 4: Create the default (client-side) example

**Files:**
- Create: `packages/registry/items/blocks/data-table/default.example.tsx`

Blocks are imported via the `@/components/block/shuip/<name>` stub alias (mirrors the kanban example).

- [ ] **Step 1: Write the example**

```tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  useDataTable,
} from '@/components/block/shuip/data-table';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
};

const users: User[] = [
  { id: '1', name: 'Ava Mercer', email: 'ava@acme.io', role: 'admin', status: 'active' },
  { id: '2', name: 'Liam Cho', email: 'liam@acme.io', role: 'editor', status: 'active' },
  { id: '3', name: 'Noah Patel', email: 'noah@acme.io', role: 'editor', status: 'invited' },
  { id: '4', name: 'Mia Rossi', email: 'mia@acme.io', role: 'viewer', status: 'suspended' },
  { id: '5', name: 'Ethan Wood', email: 'ethan@acme.io', role: 'viewer', status: 'active' },
  { id: '6', name: 'Zoe Bauer', email: 'zoe@acme.io', role: 'admin', status: 'invited' },
  { id: '7', name: 'Kai Nguyen', email: 'kai@acme.io', role: 'editor', status: 'active' },
  { id: '8', name: 'Lena Fox', email: 'lena@acme.io', role: 'viewer', status: 'suspended' },
];

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
];

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Invited', value: 'invited' },
  { label: 'Suspended', value: 'suspended' },
];

export default function DataTableDefaultExample() {
  const columns = React.useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
        meta: { label: 'Name' },
        cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Email' />,
        meta: { label: 'Email' },
        cell: ({ row }) => <span className='text-muted-foreground'>{row.original.email}</span>,
      },
      {
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Role' />,
        meta: { label: 'Role', variant: 'multiSelect', options: roleOptions },
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => <span className='capitalize'>{row.original.role}</span>,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        meta: { label: 'Status', variant: 'multiSelect', options: statusOptions },
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => <span className='capitalize'>{row.original.status}</span>,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: users,
    columns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });

  return (
    <div className='flex flex-col gap-3'>
      <DataTableToolbar table={table} searchPlaceholder='Search users...' />
      <DataTable table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/registry/items/blocks/data-table/default.example.tsx
git commit -m "feat(data-table): add client-side example"
```

---

### Task 5: Create the server-side example

**Files:**
- Create: `packages/registry/items/blocks/data-table/server.example.tsx`

Simulates a backend: an in-memory dataset queried with a `setTimeout` delay, driven by controlled pagination/sorting/filter state passed into `useDataTable` with `pageCount`.

- [ ] **Step 1: Write the example**

```tsx
'use client';

import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';
import * as React from 'react';

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  useDataTable,
} from '@/components/block/shuip/data-table';

type Order = {
  id: string;
  customer: string;
  total: number;
  status: 'paid' | 'pending' | 'refunded';
};

const STATUSES: Order['status'][] = ['paid', 'pending', 'refunded'];
const CUSTOMERS = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Soylent', 'Stark', 'Wayne'];

const ALL_ORDERS: Order[] = Array.from({ length: 47 }, (_, index) => ({
  id: `ORD-${1000 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  total: Math.round(50 + ((index * 73) % 950)),
  status: STATUSES[index % STATUSES.length],
}));

const statusOptions = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Refunded', value: 'refunded' },
];

type QueryArgs = {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
};

function queryOrders({ pagination, sorting, columnFilters, globalFilter }: QueryArgs): { rows: Order[]; total: number } {
  let rows = [...ALL_ORDERS];

  const search = globalFilter.trim().toLowerCase();
  if (search) {
    rows = rows.filter((order) => `${order.id} ${order.customer}`.toLowerCase().includes(search));
  }

  const statusFilter = columnFilters.find((filter) => filter.id === 'status')?.value as string[] | undefined;
  if (statusFilter?.length) {
    rows = rows.filter((order) => statusFilter.includes(order.status));
  }

  const sort = sorting[0];
  if (sort) {
    rows.sort((a, b) => {
      const left = a[sort.id as keyof Order];
      const right = b[sort.id as keyof Order];
      if (left < right) return sort.desc ? 1 : -1;
      if (left > right) return sort.desc ? -1 : 1;
      return 0;
    });
  }

  const total = rows.length;
  const start = pagination.pageIndex * pagination.pageSize;
  return { rows: rows.slice(start, start + pagination.pageSize), total };
}

export default function DataTableServerExample() {
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [result, setResult] = React.useState<{ rows: Order[]; total: number }>({ rows: [], total: 0 });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setResult(queryOrders({ pagination, sorting, columnFilters, globalFilter }));
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [pagination, sorting, columnFilters, globalFilter]);

  const columns = React.useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Order' />,
        meta: { label: 'Order' },
        cell: ({ row }) => <span className='font-medium'>{row.original.id}</span>,
      },
      {
        accessorKey: 'customer',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Customer' />,
        meta: { label: 'Customer' },
      },
      {
        accessorKey: 'total',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Total' />,
        meta: { label: 'Total' },
        cell: ({ row }) => <span className='tabular-nums'>${row.original.total}</span>,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        meta: { label: 'Status', variant: 'multiSelect', options: statusOptions },
        cell: ({ row }) => <span className='capitalize'>{row.original.status}</span>,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: result.rows,
    columns,
    pageCount: Math.ceil(result.total / pagination.pageSize),
    getRowId: (row) => row.id,
    state: { pagination, sorting, columnFilters, globalFilter },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className='flex flex-col gap-3'>
      <DataTableToolbar table={table} searchPlaceholder='Search orders...' />
      <DataTable table={table} isLoading={isLoading} />
      <DataTablePagination table={table} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/registry/items/blocks/data-table/server.example.tsx
git commit -m "feat(data-table): add server-side example"
```

---

### Task 6: Create the rich (Twenty-like) example

**Files:**
- Create: `packages/registry/items/blocks/data-table/rich.example.tsx`

Demonstrates row selection (checkbox column), column pinning (sticky select + name), and typed cells (avatar, status pill, chips) rendered inline with Tailwind.

- [ ] **Step 1: Write the example**

```tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  useDataTable,
} from '@/components/block/shuip/data-table';

type Person = {
  id: string;
  name: string;
  email: string;
  team: string;
  stage: 'lead' | 'qualified' | 'won';
  tags: string[];
};

const people: Person[] = [
  { id: '1', name: 'Ava Mercer', email: 'ava@acme.io', team: 'Growth', stage: 'won', tags: ['VIP', 'EU'] },
  { id: '2', name: 'Liam Cho', email: 'liam@acme.io', team: 'Sales', stage: 'qualified', tags: ['US'] },
  { id: '3', name: 'Noah Patel', email: 'noah@acme.io', team: 'Sales', stage: 'lead', tags: ['Inbound'] },
  { id: '4', name: 'Mia Rossi', email: 'mia@acme.io', team: 'Success', stage: 'won', tags: ['VIP'] },
  { id: '5', name: 'Ethan Wood', email: 'ethan@acme.io', team: 'Growth', stage: 'lead', tags: ['EU', 'Trial'] },
  { id: '6', name: 'Zoe Bauer', email: 'zoe@acme.io', team: 'Success', stage: 'qualified', tags: ['US'] },
];

const stageStyles: Record<Person['stage'], string> = {
  lead: 'bg-muted text-muted-foreground',
  qualified: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  won: 'bg-green-500/15 text-green-600 dark:text-green-400',
};

const stageOptions = [
  { label: 'Lead', value: 'lead' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Won', value: 'won' },
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
  return (
    <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs'>
      {initials}
    </span>
  );
}

export default function DataTableRichExample() {
  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
            aria-label='Select all'
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label='Select row'
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
        meta: { label: 'Name' },
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Avatar name={row.original.name} />
            <span className='font-medium'>{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Email' />,
        meta: { label: 'Email' },
        cell: ({ row }) => <span className='text-muted-foreground'>{row.original.email}</span>,
      },
      {
        accessorKey: 'team',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Team' />,
        meta: { label: 'Team' },
      },
      {
        accessorKey: 'stage',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Stage' />,
        meta: { label: 'Stage', variant: 'multiSelect', options: stageOptions },
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs capitalize ${stageStyles[row.original.stage]}`}
          >
            {row.original.stage}
          </span>
        ),
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        enableSorting: false,
        meta: { label: 'Tags' },
        cell: ({ row }) => (
          <div className='flex flex-wrap gap-1'>
            {row.original.tags.map((tag) => (
              <span key={tag} className='rounded border bg-muted px-1.5 py-0.5 text-muted-foreground text-xs'>
                {tag}
              </span>
            ))}
          </div>
        ),
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: people,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    enableColumnPinning: true,
    initialState: { columnPinning: { left: ['select', 'name'], right: [] } },
  });

  return (
    <div className='flex flex-col gap-3'>
      <DataTableToolbar table={table} searchPlaceholder='Search people...' />
      <DataTable table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/registry/items/blocks/data-table/rich.example.tsx
git commit -m "feat(data-table): add rich Twenty-like example"
```

---

### Task 7: Create the docs MDX page (with nuqs URL-sync recipe)

**Files:**
- Create: `apps/docs/content/blocks/data-table.mdx`

Blocks docs are real MDX files under `content/blocks/` (NOT `index.mdx` in the item folder). Match the kanban MDX frontmatter shape (`title`, `description`, `registryName`).

- [ ] **Step 1: Write the MDX**

````mdx
---
title: Data Table
description: An entity-agnostic, dual-mode data table built on TanStack Table. Define your columns and drop in your data — client-side out of the box, or server-side with pagination, sorting, and filtering.
registryName: data-table
---

import { TypeTable } from 'fumadocs-ui/components/type-table';

`DataTable` is a generic table system (`useDataTable<TData>` + composable sub-components) that renders any array of typed rows. All per-entity configuration lives in your TanStack `ColumnDef[]` and a typed `meta` extension; the components only ever read the table instance, so nothing is hardcoded to a domain.

### Built-in features

- **Generic data model**: `useDataTable<T>` works with any row type via `ColumnDef<T>[]`.
- **Dual mode**: client-side out of the box (sorting, filtering, pagination computed in memory) or server-side by passing `pageCount` + controlled state and `on*Change` handlers.
- **Auto-generated toolbar**: faceted filters are derived from each column's `meta.variant` / `meta.options` — no per-table wiring.
- **Composable**: drop `DataTableToolbar`, `DataTable`, and `DataTablePagination` where you want them; swap any piece.
- **Row selection, column visibility, column pinning** (sticky columns), sortable headers, global search.
- **States**: loading skeleton, empty, and no-results-after-filter.

## Examples

<ItemExamples registryName={'data-table'} />

## The `meta` convention

Per-entity configuration rides on TanStack's `ColumnMeta`, augmented by this block:

```ts
interface ColumnMeta {
  label?: string;
  placeholder?: string;
  variant?: 'text' | 'number' | 'date' | 'select' | 'multiSelect';
  options?: { label: string; value: string; icon?: React.ComponentType; count?: number }[];
  icon?: React.ComponentType;
}
```

A column with `meta.variant: 'multiSelect'` and `meta.options` automatically gets a faceted filter in the toolbar. For client-side multi-select filtering, set `filterFn: 'arrIncludesSome'` on that column.

## Client vs server mode

Client mode is the default — pass `data` and `columns` and the table computes everything:

```tsx
const { table } = useDataTable({ data, columns, getRowId: (row) => row.id });
```

Server mode activates when you pass `pageCount`. Control the state yourself and react to changes by refetching:

```tsx
const { table } = useDataTable({
  data: result.rows,
  columns,
  pageCount: Math.ceil(result.total / pagination.pageSize),
  state: { pagination, sorting, columnFilters, globalFilter },
  onPaginationChange: setPagination,
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  onGlobalFilterChange: setGlobalFilter,
});
```

## Recipe: sync state to the URL with nuqs

Server mode pairs naturally with shareable, bookmarkable URLs. This is opt-in and not bundled with the block (it would force a router dependency on every consumer). Install nuqs and wrap your app once:

```bash
bun add nuqs
```

```tsx
// app/layout.tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
```

Then drop in this hook and feed its output straight into `useDataTable`:

```tsx
// hooks/use-data-table-url-state.ts
'use client';

import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';
import { parseAsInteger, parseAsJson, parseAsString, useQueryStates } from 'nuqs';

export function useDataTableUrlState() {
  const [state, setState] = useQueryStates(
    {
      pageIndex: parseAsInteger.withDefault(0),
      pageSize: parseAsInteger.withDefault(10),
      sorting: parseAsJson<SortingState>((value) => value as SortingState).withDefault([]),
      columnFilters: parseAsJson<ColumnFiltersState>((value) => value as ColumnFiltersState).withDefault([]),
      globalFilter: parseAsString.withDefault(''),
    },
    { history: 'push', shallow: false, throttleMs: 50, clearOnDefault: true },
  );

  const pagination: PaginationState = { pageIndex: state.pageIndex, pageSize: state.pageSize };

  return {
    pagination,
    sorting: state.sorting,
    columnFilters: state.columnFilters,
    globalFilter: state.globalFilter,
    onPaginationChange: (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;
      void setState({ pageIndex: next.pageIndex, pageSize: next.pageSize });
    },
    onSortingChange: (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next = typeof updater === 'function' ? updater(state.sorting) : updater;
      void setState({ sorting: next, pageIndex: 0 });
    },
    onColumnFiltersChange: (updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      const next = typeof updater === 'function' ? updater(state.columnFilters) : updater;
      void setState({ columnFilters: next, pageIndex: 0 });
    },
    onGlobalFilterChange: (updater: string | ((old: string) => string)) => {
      const next = typeof updater === 'function' ? updater(state.globalFilter) : updater;
      void setState({ globalFilter: next, pageIndex: 0 });
    },
  };
}
```

```tsx
const url = useDataTableUrlState();
const { table } = useDataTable({
  data: result.rows,
  columns,
  pageCount: Math.ceil(result.total / url.pagination.pageSize),
  state: url,
  onPaginationChange: url.onPaginationChange,
  onSortingChange: url.onSortingChange,
  onColumnFiltersChange: url.onColumnFiltersChange,
  onGlobalFilterChange: url.onGlobalFilterChange,
});
```

## Props

<TypeTable
  type={{
    data: { description: 'The rows to render.', type: 'TData[]' },
    columns: { description: 'TanStack column definitions. Carry per-entity config in meta.', type: 'ColumnDef<TData>[]' },
    pageCount: { description: 'Total page count. Passing it switches the table to server-side (manual) mode.', type: 'number?' },
    getRowId: { description: 'Stable row id, so selection survives pagination/sorting/refetch.', type: '(row: TData, index: number) => string' },
    enableRowSelection: { description: 'Enable row selection.', type: 'boolean', default: 'false' },
    enableColumnPinning: { description: 'Enable sticky pinned columns.', type: 'boolean', default: 'false' },
    initialState: { description: 'Initial pagination / sorting / columnVisibility / columnPinning.', type: 'object?' },
    state: { description: 'Controlled state for server mode (pagination, sorting, columnFilters, globalFilter).', type: 'object?' },
    onPaginationChange: { description: 'Pagination change handler (server mode).', type: 'OnChangeFn<PaginationState>?' },
    onSortingChange: { description: 'Sorting change handler (server mode).', type: 'OnChangeFn<SortingState>?' },
    onColumnFiltersChange: { description: 'Column filters change handler (server mode).', type: 'OnChangeFn<ColumnFiltersState>?' },
    onGlobalFilterChange: { description: 'Global filter change handler (server mode).', type: 'OnChangeFn<string>?' },
  }}
/>
````

- [ ] **Step 2: Commit**

```bash
git add apps/docs/content/blocks/data-table.mdx
git commit -m "docs(data-table): add docs page with nuqs url-sync recipe"
```

---

### Task 8: Generate registry artifacts and verify the item

**Files:**
- (generated) `packages/registry/registry.json`, `packages/registry/__index__.ts`, `packages/registry/stubs/blocks/data-table.ts`, `apps/docs/public/r/data-table.json`

- [ ] **Step 1: Run the generator**

Run: `bun registry:generate`
Expected: console shows `[generate] N items processed` with N increased by one vs before. No "missing component.tsx" warning for `data-table`.

- [ ] **Step 2: Verify the generated registry entry**

Run: `grep -A8 '"name": "data-table"' packages/registry/registry.json`
Expected: the entry has `"type": "registry:block"`, `dependencies` containing `@tanstack/react-table`, and `registryDependencies` containing `table`. (The four example files are not in the registry `files` array — that is correct; examples are preview-only.)

- [ ] **Step 3: Verify the stub re-exports the named exports**

Run: `cat packages/registry/stubs/blocks/data-table.ts`
Expected: a re-export (`export * from ...`) pointing at the item's `component`. The examples import named symbols (`useDataTable`, `DataTable`, ...) through `@/components/block/shuip/data-table`, so the stub must surface them. If the generator emits a default-only stub, stop and report — the block needs named exports.

- [ ] **Step 4: Regenerate fumadocs source types**

Run: `cd apps/docs && bunx fumadocs-mdx`
Expected: `.source` regenerates without error; the `data-table` block doc is picked up.

- [ ] **Step 5: Commit generated artifacts**

```bash
git add packages/registry/registry.json packages/registry/__index__.ts packages/registry/stubs apps/docs/public/r apps/docs/content/components
git commit -m "chore(registry): regenerate artifacts for data-table block"
```

---

### Task 9: Full build / type gate

- [ ] **Step 1: Biome check**

Run: `bun check`
Expected: no errors. Fix any reported issues (formatting is auto-written).

- [ ] **Step 2: Authoritative type gate via docs build**

Run: `NODE_OPTIONS=--max-old-space-size=6144 bun build:docs`
Expected: build succeeds. `next build` is the authoritative type gate — all four data-table files (component + 3 examples) and the MDX must compile. If it OOMs (exit 137), re-run with the same `NODE_OPTIONS` already set.

- [ ] **Step 3: If anything failed, fix at the root and re-run**

Do not patch around type errors. Common causes: a primitive export name mismatch (re-check against `packages/ui/src/components/ui/*`), a missing `filterFn: 'arrIncludesSome'` on a multiSelect column, or the `meta` augmentation not being visible (it lives in `component.tsx` and must be imported transitively via the stub — it is).

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(data-table): resolve type/lint issues from build"
```

---

### Task 10: Manual preview verification

- [ ] **Step 1: Run the docs dev server**

Run: `bun dev:docs`
Then open `/blocks/data-table`.

- [ ] **Step 2: Verify each example**

- Default: sort via header menu, type in search, open a faceted filter (Role/Status) and toggle values, hide a column via View, paginate. Counts appear in faceted options.
- Server: paginate/sort/filter — a brief skeleton appears on each change (the 400ms simulated fetch), and results update.
- Rich: the select + name columns stay pinned while scrolling horizontally; checkboxes select rows; status pills and tag chips render.

- [ ] **Step 3: Stop the dev server.** No commit (verification only).

---

## Self-review notes (for the executor)

- The `meta` module augmentation is declared once in `component.tsx`; it is global to the package once imported. Examples rely on it for `meta.options`.
- `getFilteredSelectedRowModel()` / `getFilteredRowModel()` in `DataTablePagination` fall back to the core row model in server mode (no faceted/filtered models registered) — the "selected" count then reflects the current page, which is acceptable for the demo.
- Faceted filter counts only appear in client mode (server mode has no faceted row model); this is expected.
- If `bun check` reformats the long Tailwind class strings, accept its formatting (Biome is the source of truth).
