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
import { TableBody, TableCell, TableHead, TableHeader, Table as TableRoot, TableRow } from '@/components/ui/table';
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
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialState?.columnVisibility ?? {});
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
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className='justify-center text-center'
                  >
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
  const columns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide());

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

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = 'Search...',
  children,
}: DataTableToolbarProps<TData>) {
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
