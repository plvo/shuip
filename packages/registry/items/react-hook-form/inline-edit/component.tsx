'use client';

import type { Lens } from '@hookform/lenses';
import { InfoIcon } from 'lucide-react';
import * as React from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type InlineEditSize = 'sm' | 'default' | 'title';
type InlineEditVariant = 'ghost' | 'boxed';
type InlineEditInput = 'text' | 'textarea';

interface InlineEditProps {
  value: string;
  onCommit: (next: string) => Promise<string | undefined> | string | undefined;
  input?: InlineEditInput;
  variant?: InlineEditVariant;
  size?: InlineEditSize;
  placeholder?: string;
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

function InlineEdit({
  value,
  onCommit,
  input = 'text',
  variant = 'ghost',
  size = 'default',
  placeholder = '—',
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
    setState({ kind: 'saving', draft });
    const error = await onCommit(draft);
    setState(error ? { kind: 'editing', draft, error } : { kind: 'reading' });
  };

  const displayedError = state.kind === 'editing' ? state.error : undefined;
  const isSaving = state.kind === 'saving';

  let content: React.ReactNode;
  if (state.kind === 'reading') {
    const isEmpty = value === '';
    content = (
      <span
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

export interface InlineEditFieldProps
  extends Pick<InlineEditProps, 'input' | 'variant' | 'size' | 'placeholder' | 'canEdit' | 'children'> {
  lens: Lens<string>;
  label?: string;
  description?: string;
  orientation?: 'vertical' | 'horizontal';
}

export function InlineEditField({
  lens,
  label,
  description,
  orientation = 'vertical',
  ...props
}: InlineEditFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const { trigger, getFieldState, formState } = useFormContext();

  const handleCommit = async (next: string) => {
    field.onChange(next);
    if (await trigger(field.name)) return undefined;
    return getFieldState(field.name, formState).error?.message ?? 'Invalid value';
  };

  return (
    <Field
      orientation={orientation}
      data-invalid={fieldState.invalid}
      className={cn('gap-2', orientation === 'horizontal' && '[&>[data-slot=field-label]]:flex-none')}
    >
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <div className={cn('flex items-center gap-2', orientation === 'horizontal' && 'flex-1')}>
        <InlineEdit {...props} value={field.value ?? ''} onCommit={handleCommit} />
        {description && (
          <Popover>
            <PopoverTrigger aria-label='Info' className='text-muted-foreground transition-colors hover:text-foreground'>
              <InfoIcon className='size-4' />
            </PopoverTrigger>
            <PopoverContent className='w-64 text-sm'>{description}</PopoverContent>
          </Popover>
        )}
      </div>
    </Field>
  );
}
