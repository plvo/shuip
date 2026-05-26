'use client';

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Search } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  cardContent?: (item: T) => React.ReactNode;
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
  onDataChange,
  idField = 'id' as keyof T,
  columnField,
  titleField,
  fields,
  cardContent,
  searchableFields,
  searchPlaceholder = 'Search...',
  renderColumnSummary,
  onCardClick,
  onCardAdd,
  onCardMove,
  className,
}: KanbanProps<T>) {
  const getId = React.useCallback((item: T) => String(item[idField]), [idField]);
  const getColumn = React.useCallback((item: T) => String(item[columnField]), [columnField]);

  const [items, setItems] = React.useState<T[]>(() => data ?? defaultData ?? []);
  const draggingRef = React.useRef(false);
  const fromColumnRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (data && !draggingRef.current) setItems(data);
  }, [data]);

  const [query, setQuery] = React.useState('');
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchableFields?.length) return items;
    return items.filter((it) =>
      searchableFields.some((f) =>
        String(it[f] ?? '')
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [items, query, searchableFields]);

  const itemsByColumn = React.useCallback(
    (columnId: string) => visible.filter((it) => getColumn(it) === columnId),
    [visible, getColumn],
  );

  const reorder = React.useCallback(
    (activeCardId: string, toColumn: string, overCardId: string | null): { next: T[]; toIndex: number } | null => {
      const item = items.find((it) => getId(it) === activeCardId);
      if (!item) return null;
      const moved = { ...item, [columnField]: toColumn } as T;
      const without = items.filter((it) => getId(it) !== activeCardId);
      const colItems = without.filter((it) => getColumn(it) === toColumn);

      let colIndex: number;
      if (overCardId && overCardId !== activeCardId) {
        const found = colItems.findIndex((it) => getId(it) === overCardId);
        colIndex = found < 0 ? colItems.length : found;
      } else {
        colIndex = colItems.length;
      }

      let flatIndex: number;
      if (colIndex < colItems.length) {
        flatIndex = without.findIndex((it) => getId(it) === getId(colItems[colIndex]));
      } else if (colItems.length > 0) {
        flatIndex = without.findIndex((it) => getId(it) === getId(colItems[colItems.length - 1])) + 1;
      } else {
        flatIndex = without.length;
      }

      const next = [...without];
      next.splice(flatIndex, 0, moved);
      return { next, toIndex: colIndex };
    },
    [items, getId, getColumn, columnField],
  );

  function handleDragStart(event: DragStartEvent) {
    draggingRef.current = true;
    const id = String(event.active.id);
    const startItem = items.find((it) => getId(it) === id);
    fromColumnRef.current = startItem ? getColumn(startItem) : null;
    setActiveId(id);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeCardId = String(active.id);
    const overId = String(over.id);
    if (activeCardId === overId) return;

    const activeItem = items.find((it) => getId(it) === activeCardId);
    if (!activeItem) return;

    const overIsColumn = columns.some((c) => c.id === overId);
    const overItem = overIsColumn ? null : items.find((it) => getId(it) === overId);
    const overColumn = overIsColumn ? overId : overItem ? getColumn(overItem) : null;
    if (!overColumn || overColumn === getColumn(activeItem)) return;

    setItems((prev) => {
      const current = prev.find((it) => getId(it) === activeCardId);
      if (!current) return prev;
      const moved = { ...current, [columnField]: overColumn } as T;
      const without = prev.filter((it) => getId(it) !== activeCardId);
      if (overItem) {
        const idx = without.findIndex((it) => getId(it) === overId);
        without.splice(idx < 0 ? without.length : idx, 0, moved);
        return without;
      }
      without.push(moved);
      return without;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    draggingRef.current = false;
    setActiveId(null);
    const { active, over } = event;
    const fromColumn = fromColumnRef.current;
    fromColumnRef.current = null;
    if (!over || fromColumn == null) return;

    const activeCardId = String(active.id);
    if (!items.some((it) => getId(it) === activeCardId)) return;

    let toColumn: string;
    let overCardId: string | null = null;
    if (columns.some((c) => c.id === String(over.id))) {
      toColumn = String(over.id);
    } else {
      const overItem = items.find((it) => getId(it) === String(over.id));
      if (!overItem) return;
      toColumn = getColumn(overItem);
      overCardId = String(over.id);
    }

    const result = reorder(activeCardId, toColumn, overCardId);
    if (!result) return;
    setItems(result.next);
    onDataChange?.(result.next);
    const movedItem = result.next.find((it) => getId(it) === activeCardId);
    if (movedItem) onCardMove?.({ item: movedItem, fromColumn, toColumn, toIndex: result.toIndex });
  }

  function handleDragCancel() {
    draggingRef.current = false;
    fromColumnRef.current = null;
    setActiveId(null);
  }

  const activeItem = activeId ? (items.find((it) => getId(it) === activeId) ?? null) : null;

  const renderTitle = React.useCallback(
    (item: T): React.ReactNode => (titleField == null ? null : String(item[titleField] ?? '')),
    [titleField],
  );

  const renderBody = React.useCallback(
    (item: T): React.ReactNode => {
      if (cardContent) return cardContent(item);
      if (!fields?.length) return null;
      return (
        <div className='flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground'>
          {fields.map((field) => {
            const value = item[field.key];
            return (
              <span key={String(field.key)} className='whitespace-nowrap'>
                {field.label ? <span className='font-medium'>{field.label}: </span> : null}
                {field.render ? field.render(value, item) : String(value ?? '')}
              </span>
            );
          })}
        </div>
      );
    },
    [cardContent, fields],
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {searchableFields?.length ? (
        <div className='relative w-full max-w-xs'>
          <Search className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className='pl-8'
          />
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
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
                <SortableContext items={columnItems.map((it) => getId(it))} strategy={verticalListSortingStrategy}>
                  {columnItems.length === 0 ? (
                    <p className='rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground'>
                      No items
                    </p>
                  ) : (
                    columnItems.map((item) => (
                      <SortableCard
                        key={getId(item)}
                        id={getId(item)}
                        columnId={column.id}
                        title={renderTitle(item)}
                        body={renderBody(item)}
                        onClick={onCardClick ? () => onCardClick(item) : undefined}
                      />
                    ))
                  )}
                </SortableContext>
              </KanbanColumnView>
            );
          })}
        </div>

        <DragOverlay>
          {activeItem ? (
            <KanbanCardFace
              title={renderTitle(activeItem)}
              body={renderBody(activeItem)}
              className='rotate-3 shadow-lg'
              handle={<GripVertical className='mt-0.5 size-4 shrink-0 text-muted-foreground' />}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
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
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
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
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-24 flex-col gap-2 rounded-lg border border-transparent p-2 transition-colors',
          isOver && 'border-border bg-muted/50',
        )}
      >
        {children}
      </div>
    </div>
  );
}

function SortableCard({
  id,
  columnId,
  title,
  body,
  onClick,
}: {
  id: string;
  columnId: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { columnId },
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-50')}>
      <KanbanCardFace
        title={title}
        body={body}
        onClick={onClick}
        handle={
          <button
            type='button'
            className='mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing'
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className='size-4' />
          </button>
        }
      />
    </div>
  );
}

function KanbanCardFace({
  title,
  body,
  onClick,
  handle,
  className,
}: {
  title?: React.ReactNode;
  body?: React.ReactNode;
  onClick?: () => void;
  handle?: React.ReactNode;
  className?: string;
}) {
  const hasBody = body != null;
  return (
    <Card className={cn('gap-0 py-0', onClick && 'cursor-pointer', className)} onClick={onClick}>
      <CardHeader className={cn('flex flex-row items-start gap-2 space-y-0 px-3 pt-3', hasBody ? 'pb-0' : 'pb-3')}>
        {handle}
        {title != null ? (
          <CardTitle className='flex-1 text-sm leading-snug'>{title}</CardTitle>
        ) : (
          <span className='flex-1' />
        )}
      </CardHeader>
      {hasBody ? <CardContent className='px-3 pb-3 pl-9 pt-1'>{body}</CardContent> : null}
    </Card>
  );
}
