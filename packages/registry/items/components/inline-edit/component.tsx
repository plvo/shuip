'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type InlineEditSize = 'sm' | 'default' | 'title';
type InlineEditVariant = 'ghost' | 'boxed';
type InlineEditInput = 'text' | 'textarea';

export interface InlineEditProps {
  value: string;
  onSave: (next: string) => Promise<void> | void;
  input?: InlineEditInput;
  variant?: InlineEditVariant;
  size?: InlineEditSize;
  placeholder?: string;
  validate?: (next: string) => string | undefined;
  error?: string;
  canEdit?: boolean;
  children?: (api: {
    value: string;
    setValue: (v: string) => void;
    commit: (next?: string) => void;
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
  placeholder = '—',
  validate,
  error,
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

  const commit = async (override?: string) => {
    if (state.kind !== 'editing') return;
    const draft = override ?? state.draft;
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

  const internalError = state.kind === 'editing' ? state.error : undefined;
  const displayedError = internalError ?? error;
  const isSaving = state.kind === 'saving';

  let content: React.ReactNode;
  if (state.kind === 'reading') {
    const isEmpty = value === '';
    content = (
      <span
        data-slot='inline-edit'
        role={canEdit ? 'button' : undefined}
        tabIndex={canEdit ? 0 : undefined}
        aria-invalid={!!displayedError}
        aria-describedby={displayedError ? errorId : undefined}
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
      </span>
    );
  } else {
    const { draft } = state;
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

    content = children ? (
      children({
        value: draft,
        setValue: setDraft,
        commit: (next?: string) => void commit(next),
        cancel,
        className: editorClassName,
        autoFocus: true,
      })
    ) : input === 'textarea' ? (
      <Textarea
        autoFocus
        value={draft}
        disabled={isSaving}
        aria-invalid={!!displayedError}
        aria-describedby={displayedError ? errorId : undefined}
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
        aria-invalid={!!displayedError}
        aria-describedby={displayedError ? errorId : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={handleKeyDown}
        className={editorClassName}
      />
    );
  }

  return (
    <div className='flex w-full flex-col gap-1'>
      <div className='flex items-center gap-2'>
        <div className='min-w-0 flex-1'>{content}</div>
        {isSaving && <span aria-hidden className='size-1.5 shrink-0 animate-pulse rounded-full bg-primary/60' />}
      </div>
      {displayedError && (
        <p id={errorId} className='text-xs text-destructive'>
          {displayedError}
        </p>
      )}
    </div>
  );
}
