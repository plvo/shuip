'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type InlineEditSize = 'sm' | 'default' | 'title';
type InlineEditVariant = 'ghost' | 'boxed';
type InlineEditInput = 'text' | 'textarea';
type InlineEditTag = 'span' | 'p' | 'h1' | 'h2' | 'h3';

export interface InlineEditProps {
  value: string;
  onSave: (next: string) => Promise<void> | void;
  input?: InlineEditInput;
  variant?: InlineEditVariant;
  size?: InlineEditSize;
  as?: InlineEditTag;
  placeholder?: string;
  validate?: (next: string) => string | undefined;
  canEdit?: boolean;
  children?: (api: {
    value: string;
    setValue: (v: string) => void;
    commit: () => void;
    cancel: () => void;
    className: string;
    autoFocus: true;
  }) => React.ReactNode;
}

type State =
  | { kind: 'reading' }
  | { kind: 'editing'; draft: string; error?: string }
  | { kind: 'saving'; draft: string };

const sizeClasses: Record<InlineEditSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  default: 'px-2 py-1 text-sm',
  title: 'px-2 py-1 text-3xl font-semibold tracking-tight',
};

const variantClasses: Record<InlineEditVariant, string> = {
  ghost:
    'border border-transparent bg-transparent hover:bg-muted focus-visible:bg-muted dark:bg-transparent dark:hover:bg-muted',
  boxed: 'border border-input bg-transparent shadow-xs focus-visible:border-ring',
};

export function InlineEdit({
  value,
  onSave,
  input = 'text',
  variant = 'ghost',
  size = 'default',
  as: Tag = 'span',
  placeholder = '—',
  validate,
  canEdit = true,
  children,
}: InlineEditProps) {
  const [state, setState] = React.useState<State>({ kind: 'reading' });
  const errorId = React.useId();

  const fieldClassName = cn(
    'w-full rounded-md text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
    sizeClasses[size],
    variantClasses[variant],
  );

  const startEdit = () => {
    if (canEdit) setState({ kind: 'editing', draft: value });
  };

  const cancel = () => setState({ kind: 'reading' });

  const setDraft = (draft: string) => setState((s) => (s.kind === 'editing' ? { kind: 'editing', draft } : s));

  const commit = async () => {
    if (state.kind !== 'editing') return;
    const { draft } = state;
    if (draft === value) {
      setState({ kind: 'reading' });
      return;
    }
    const validationError = validate?.(draft);
    if (validationError) {
      setState({ kind: 'editing', draft, error: validationError });
      return;
    }
    setState({ kind: 'saving', draft });
    try {
      await onSave(draft);
      setState({ kind: 'reading' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setState({ kind: 'editing', draft, error: message });
    }
  };

  if (state.kind === 'reading') {
    const isEmpty = value === '';
    return (
      <Tag
        data-slot='inline-edit'
        role={canEdit ? 'button' : undefined}
        tabIndex={canEdit ? 0 : undefined}
        onClick={canEdit ? startEdit : undefined}
        onKeyDown={
          canEdit
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  startEdit();
                }
              }
            : undefined
        }
        className={cn(
          fieldClassName,
          'block',
          canEdit ? 'cursor-text' : 'cursor-default',
          input === 'textarea' && 'whitespace-pre-wrap',
          isEmpty && 'text-muted-foreground',
        )}
      >
        {isEmpty ? placeholder : value}
      </Tag>
    );
  }

  const { draft } = state;
  const error = state.kind === 'editing' ? state.error : undefined;
  const isSaving = state.kind === 'saving';
  const editorClassName = cn(fieldClassName, 'h-auto min-w-0 shadow-none');

  const handleKeyDown: React.KeyboardEventHandler = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
    if (e.key === 'Enter' && input === 'text') {
      e.preventDefault();
      void commit();
    }
  };

  const editor = children ? (
    children({
      value: draft,
      setValue: setDraft,
      commit: () => void commit(),
      cancel,
      className: editorClassName,
      autoFocus: true,
    })
  ) : input === 'textarea' ? (
    <Textarea
      autoFocus
      value={draft}
      disabled={isSaving}
      aria-invalid={!!error}
      aria-describedby={error ? errorId : undefined}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={handleKeyDown}
      className={editorClassName}
    />
  ) : (
    <Input
      autoFocus
      type='text'
      value={draft}
      disabled={isSaving}
      aria-invalid={!!error}
      aria-describedby={error ? errorId : undefined}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={handleKeyDown}
      className={editorClassName}
    />
  );

  return (
    <div className='flex w-full flex-col gap-1'>
      <div className='flex items-center gap-2'>
        <div className='min-w-0 flex-1'>{editor}</div>
        {isSaving && <span aria-hidden className='size-1.5 shrink-0 animate-pulse rounded-full bg-primary/60' />}
      </div>
      {error && (
        <span id={errorId} className='text-xs text-destructive'>
          {error}
        </span>
      )}
    </div>
  );
}
