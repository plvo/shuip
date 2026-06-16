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
  Inbox,
  Loader2,
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
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(() => ({
    left: initialState?.columnPinning?.left ?? [],
    right: initialState?.columnPinning?.right ?? [],
  }));

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

function getColumnStyles<TData>(column: Column<TData>): React.CSSProperties {
  const pinned = column.getIsPinned();
  return {
    width: column.getSize(),
    ...(pinned
      ? {
          position: 'sticky',
          left: pinned === 'left' ? column.getStart('left') : undefined,
          right: pinned === 'right' ? column.getAfter('right') : undefined,
          zIndex: 1,
        }
      : {}),
  };
}

function getPinClass<TData>(column: Column<TData>): string | undefined {
  return column.getIsPinned() ? 'bg-background' : undefined;
}

const skeletonBar = <div className='h-5 w-full animate-pulse rounded bg-muted' />;

const shimmerBar = (
  <div className='relative h-5 w-full overflow-hidden rounded bg-muted'>
    <div
      className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent motion-reduce:hidden'
      style={{ animation: 'shuip-dt-shimmer 1.5s infinite' }}
    />
  </div>
);

const shimmerKeyframes = <style>{'@keyframes shuip-dt-shimmer{100%{transform:translateX(100%)}}'}</style>;

export type DataTableProps<TData> = {
  table: Table<TData>;
  isLoading?: boolean;
  loadingVariant?: 'skeleton' | 'overlay' | 'shimmer';
  emptyState?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  className?: string;
};

export function DataTable<TData>({
  table,
  isLoading,
  loadingVariant = 'skeleton',
  emptyState,
  onRowClick,
  className,
}: DataTableProps<TData>) {
  const columnCount = table.getVisibleLeafColumns().length;
  const rows = table.getRowModel().rows;
  const showSkeleton = isLoading && loadingVariant !== 'overlay';
  const showOverlay = isLoading && loadingVariant === 'overlay';

  return (
    <div className={cn('relative rounded-md border', className)}>
      <TableRoot
        className={cn('table-fixed', showOverlay && 'pointer-events-none opacity-60')}
        style={{ minWidth: table.getTotalSize() }}
      >
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={getColumnStyles(header.column)}
                  className={getPinClass(header.column)}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {showSkeleton ? (
            Array.from({ length: table.getState().pagination.pageSize }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {table.getVisibleLeafColumns().map((column) => (
                  <TableCell key={column.id} style={getColumnStyles(column)} className={getPinClass(column)}>
                    {loadingVariant === 'shimmer' ? shimmerBar : skeletonBar}
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
                  <TableCell
                    key={cell.id}
                    style={getColumnStyles(cell.column)}
                    className={cn('overflow-hidden', getPinClass(cell.column))}
                  >
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
      {showOverlay && (
        <div className='absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]'>
          <Loader2 className='size-5 animate-spin text-muted-foreground' />
        </div>
      )}
      {loadingVariant === 'shimmer' && shimmerKeyframes}
    </div>
  );
}

export type DataTableEmptyProps = {
  variant?: 'text' | 'illustrated' | 'with-action';
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
};

export function DataTableEmpty({
  variant = 'text',
  title = 'No results',
  description,
  icon: Icon = Inbox,
  action,
}: DataTableEmptyProps) {
  if (variant === 'text') {
    return <span className='text-muted-foreground text-sm'>{title}</span>;
  }

  return (
    <div className='flex flex-col items-center justify-center gap-3 py-6 text-center'>
      <div className='flex size-12 items-center justify-center rounded-full bg-muted/50'>
        <Icon className='size-6 text-muted-foreground' />
      </div>
      <div className='space-y-1'>
        <p className='text-balance font-medium text-sm'>{title}</p>
        {description && <p className='mx-auto max-w-xs text-balance text-muted-foreground text-sm'>{description}</p>}
      </div>
      {variant === 'with-action' && action}
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
                      const next = new Set(selectedValues);
                      if (isSelected) next.delete(option.value);
                      else next.add(option.value);
                      const filterValues = Array.from(next);
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
                    {(facets?.get(option.value) ?? 0) > 0 && (
                      <span className='ml-auto flex size-4 items-center justify-center font-mono text-xs'>
                        {facets?.get(option.value)}
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

type FilterChip = { key: string; label: string; onRemove: () => void };

function getFilterChips<TData>(table: Table<TData>): FilterChip[] {
  const chips: FilterChip[] = [];
  const globalFilter = table.getState().globalFilter as string;
  if (globalFilter) {
    chips.push({ key: 'global', label: `Search: ${globalFilter}`, onRemove: () => table.setGlobalFilter('') });
  }
  for (const filter of table.getState().columnFilters) {
    const column = table.getColumn(filter.id);
    const meta = column?.columnDef.meta;
    const columnLabel = meta?.label ?? filter.id;
    const values = Array.isArray(filter.value) ? (filter.value as string[]) : [filter.value as string];
    for (const value of values) {
      const optionLabel = meta?.options?.find((option) => option.value === value)?.label ?? String(value);
      chips.push({
        key: `${filter.id}-${value}`,
        label: `${columnLabel}: ${optionLabel}`,
        onRemove: () => {
          const next = values.filter((item) => item !== value);
          column?.setFilterValue(next.length ? next : undefined);
        },
      });
    }
  }
  return chips;
}

export type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  searchPlaceholder?: string;
  variant?: 'default' | 'inline-chips' | 'minimal';
  children?: React.ReactNode;
};

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = 'Search...',
  variant = 'default',
  children,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || Boolean(table.getState().globalFilter);
  const showFacets = variant !== 'minimal';
  const showChips = variant === 'inline-chips';
  const filterableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanFilter() && column.columnDef.meta?.variant);
  const chips = showChips ? getFilterChips(table) : [];

  const clearAll = () => {
    table.resetColumnFilters();
    table.setGlobalFilter('');
  };

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder={searchPlaceholder}
          value={(table.getState().globalFilter as string) ?? ''}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className='h-8 w-40 lg:w-56'
        />
        {showFacets &&
          filterableColumns.map((column) => {
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
        {isFiltered && !showChips && (
          <Button variant='ghost' size='sm' className='h-8 px-2' onClick={clearAll}>
            Reset <X className='ml-2 size-4' />
          </Button>
        )}
        {children}
        <DataTableViewOptions table={table} />
      </div>
      {showChips && chips.length > 0 && (
        <div className='flex flex-wrap items-center gap-1.5'>
          {chips.map((chip) => (
            <span
              key={chip.key}
              className='inline-flex items-center gap-1 rounded-full bg-secondary py-0.5 pr-1 pl-2 text-secondary-foreground text-xs'
            >
              {chip.label}
              <button
                type='button'
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.label}`}
                className='flex size-4 items-center justify-center rounded-full hover:bg-background/60'
              >
                <X className='size-3' />
              </button>
            </span>
          ))}
          <Button variant='ghost' size='sm' className='h-6 px-2 text-xs' onClick={clearAll}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

function getPaginationRange(currentPage: number, pageCount: number, siblings = 1): (number | 'ellipsis')[] {
  const totalPageNumbers = siblings * 2 + 5;
  if (pageCount <= totalPageNumbers) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(currentPage - siblings, 1);
  const rightSibling = Math.min(currentPage + siblings, pageCount);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < pageCount - 1;
  const edgeCount = 3 + 2 * siblings;

  if (!showLeftEllipsis && showRightEllipsis) {
    return [...Array.from({ length: edgeCount }, (_, index) => index + 1), 'ellipsis', pageCount];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    return [1, 'ellipsis', ...Array.from({ length: edgeCount }, (_, index) => pageCount - edgeCount + 1 + index)];
  }
  return [
    1,
    'ellipsis',
    ...Array.from({ length: rightSibling - leftSibling + 1 }, (_, index) => leftSibling + index),
    'ellipsis',
    pageCount,
  ];
}

export type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  pageSizeOptions?: number[];
  variant?: 'simple' | 'numbered';
};

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  variant = 'simple',
}: DataTablePaginationProps<TData>) {
  const pageSize = table.getState().pagination.pageSize;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);
  const options = pageSizeOptions.includes(pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pageSize].sort((a, b) => a - b);

  return (
    <div className='flex flex-wrap items-center justify-between gap-4'>
      <div className='text-muted-foreground text-sm'>
        {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className='flex flex-wrap items-center gap-4 lg:gap-6'>
        <div className='flex items-center gap-2'>
          <p className='font-medium text-sm'>Rows per page</p>
          <Select value={`${pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
            <SelectTrigger className='h-8 w-[72px]'>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {options.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {variant === 'numbered' ? (
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='icon-sm'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label='Previous page'
            >
              <ChevronLeft className='size-4' />
            </Button>
            {getPaginationRange(pageIndex + 1, pageCount).map((page, index) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className='flex size-8 items-center justify-center text-muted-foreground text-sm'
                >
                  &hellip;
                </span>
              ) : (
                <Button
                  key={page}
                  variant={page === pageIndex + 1 ? 'default' : 'ghost'}
                  size='icon-sm'
                  className='tabular-nums'
                  aria-current={page === pageIndex + 1 ? 'page' : undefined}
                  onClick={() => table.setPageIndex(page - 1)}
                >
                  {page}
                </Button>
              ),
            )}
            <Button
              variant='outline'
              size='icon-sm'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label='Next page'
            >
              <ChevronRight className='size-4' />
            </Button>
          </div>
        ) : (
          <>
            <div className='flex items-center font-medium text-sm'>
              Page {pageIndex + 1} of {pageCount}
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='icon-sm'
                className='hidden lg:flex'
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label='First page'
              >
                <ChevronsLeft className='size-4' />
              </Button>
              <Button
                variant='outline'
                size='icon-sm'
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label='Previous page'
              >
                <ChevronLeft className='size-4' />
              </Button>
              <Button
                variant='outline'
                size='icon-sm'
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label='Next page'
              >
                <ChevronRight className='size-4' />
              </Button>
              <Button
                variant='outline'
                size='icon-sm'
                className='hidden lg:flex'
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                aria-label='Last page'
              >
                <ChevronsRight className='size-4' />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export type DataTableLoadMoreProps = {
  onLoadMore: () => void;
  hasMore: boolean;
  mode?: 'button' | 'infinite';
  isLoading?: boolean;
  loaded?: number;
  total?: number;
};

export function DataTableLoadMore({
  onLoadMore,
  hasMore,
  mode = 'button',
  isLoading = false,
  loaded,
  total,
}: DataTableLoadMoreProps) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const onLoadMoreRef = React.useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  React.useEffect(() => {
    if (mode !== 'infinite' || !hasMore || isLoading) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreRef.current();
      },
      { rootMargin: '120px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode, hasMore, isLoading]);

  const count = loaded != null && total != null ? `Showing ${loaded} of ${total}` : null;

  if (mode === 'infinite') {
    return (
      <div className='flex min-h-9 flex-col items-center justify-center gap-2 py-4 text-muted-foreground text-sm'>
        {hasMore ? (
          <>
            <div ref={sentinelRef} aria-hidden className='h-px w-full' />
            {isLoading && <Loader2 className='size-4 animate-spin' />}
          </>
        ) : (
          <span>All caught up</span>
        )}
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-2 py-4'>
      {hasMore ? (
        <Button variant='outline' size='sm' onClick={onLoadMore} disabled={isLoading}>
          {isLoading && <Loader2 className='mr-2 size-4 animate-spin' />}
          Load more
        </Button>
      ) : (
        <span className='text-muted-foreground text-sm'>All caught up</span>
      )}
      {count && <span className='text-muted-foreground text-xs'>{count}</span>}
    </div>
  );
}
