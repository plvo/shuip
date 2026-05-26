'use client';

import { GripVertical, Plus } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type KanbanColumn = {
  id: string;
  label: string;
  color?: string;
};

export type KanbanField<T> = {
  key: keyof T;
  label?: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
};

export type KanbanProps<T extends Record<string, unknown>> = {
  columns: KanbanColumn[];
  data?: T[];
  defaultData?: T[];
  onDataChange?: (next: T[]) => void;
  idField?: keyof T;
  columnField: keyof T;
  titleField?: keyof T;
  fields?: KanbanField<T>[];
  renderCard?: (item: T) => React.ReactNode;
  searchableFields?: (keyof T)[];
  searchPlaceholder?: string;
  renderColumnSummary?: (items: T[], column: KanbanColumn) => React.ReactNode;
  onCardClick?: (item: T) => void;
  onCardAdd?: (columnId: string) => void;
  onCardMove?: (e: { item: T; fromColumn: string; toColumn: string; toIndex: number }) => void;
  className?: string;
};

export function Kanban<T extends Record<string, unknown>>({
  columns,
  data,
  defaultData,
  idField = 'id' as keyof T,
  columnField,
  titleField,
  fields,
  renderCard,
  renderColumnSummary,
  onCardClick,
  onCardAdd,
  className,
}: KanbanProps<T>) {
  const getId = React.useCallback((item: T) => String(item[idField]), [idField]);
  const getColumn = React.useCallback((item: T) => String(item[columnField]), [columnField]);

  const [items, setItems] = React.useState<T[]>(() => data ?? defaultData ?? []);
  React.useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const itemsByColumn = React.useCallback(
    (columnId: string) => items.filter((it) => getColumn(it) === columnId),
    [items, getColumn],
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className='flex flex-row gap-4 overflow-x-auto pb-2'>
        {columns.map((column) => {
          const columnItems = itemsByColumn(column.id);
          return (
            <KanbanColumnView
              key={column.id}
              column={column}
              count={columnItems.length}
              summary={renderColumnSummary?.(columnItems, column)}
              onAdd={onCardAdd ? () => onCardAdd(column.id) : undefined}
            >
              {columnItems.length === 0 ? (
                <p className='rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground'>
                  No items
                </p>
              ) : (
                columnItems.map((item) => (
                  <KanbanCardShell key={getId(item)} onClick={onCardClick ? () => onCardClick(item) : undefined}>
                    <CardBody item={item} titleField={titleField} fields={fields} renderCard={renderCard} />
                  </KanbanCardShell>
                ))
              )}
            </KanbanColumnView>
          );
        })}
      </div>
    </div>
  );
}

function KanbanColumnView({
  column,
  count,
  summary,
  onAdd,
  children,
}: {
  column: KanbanColumn;
  count: number;
  summary?: React.ReactNode;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className='flex w-72 shrink-0 flex-col gap-3'>
      <div className='flex items-center gap-2'>
        {column.color ? <span className='size-2 rounded-full' style={{ backgroundColor: column.color }} /> : null}
        <span className='text-sm font-medium'>{column.label}</span>
        <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>{count}</span>
        {summary != null ? <span className='ml-auto text-xs text-muted-foreground'>{summary}</span> : null}
        {onAdd ? (
          <Button variant='ghost' size='icon' className={cn('size-6', summary == null && 'ml-auto')} onClick={onAdd}>
            <Plus className='size-4' />
          </Button>
        ) : null}
      </div>
      <div className='flex min-h-24 flex-col gap-2 rounded-lg border border-transparent p-2'>{children}</div>
    </div>
  );
}

function KanbanCardShell({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <Card className={cn('gap-0 py-0', onClick && 'cursor-pointer')} onClick={onClick}>
      <CardContent className='flex items-start gap-2 p-3'>
        <span className='mt-0.5 text-muted-foreground'>
          <GripVertical className='size-4' />
        </span>
        <div className='min-w-0 flex-1'>{children}</div>
      </CardContent>
    </Card>
  );
}

function CardBody<T extends Record<string, unknown>>({
  item,
  titleField,
  fields,
  renderCard,
}: {
  item: T;
  titleField?: keyof T;
  fields?: KanbanField<T>[];
  renderCard?: (item: T) => React.ReactNode;
}) {
  if (renderCard) return <>{renderCard(item)}</>;
  return (
    <div className='space-y-1'>
      {titleField ? <p className='truncate text-sm font-medium'>{String(item[titleField] ?? '')}</p> : null}
      {fields?.length ? (
        <div className='flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground'>
          {fields.map((field) => {
            const value = item[field.key];
            return (
              <span key={String(field.key)} className='whitespace-nowrap'>
                {field.label ? `${field.label}: ` : null}
                {field.render ? field.render(value, item) : String(value ?? '')}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
