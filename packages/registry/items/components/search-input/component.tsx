'use client';

import { Search } from 'lucide-react';
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export interface SearchInputProps extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  onChange: (value: string) => void;
  debounceMs?: number;
  hotkey?: string | false;
  hotkeyTooltip?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  debounceMs = 250,
  hotkey = '/',
  hotkeyTooltip,
  autoFocus,
  className,
  ...props
}: SearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [text, setText] = React.useState(typeof value === 'string' ? value : '');
  const [focused, setFocused] = React.useState(false);
  const [hintOpen, setHintOpen] = React.useState(false);

  const resolvedTooltip = hotkeyTooltip ?? (hotkey ? `Press ${hotkey} to search` : undefined);

  React.useEffect(() => {
    if (typeof value === 'string') setText(value);
  }, [value]);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  React.useEffect(() => {
    if (!hotkey) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== hotkey || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hotkey]);

  function handleChange(next: string) {
    setText(next);
    if (timer.current) clearTimeout(timer.current);
    if (debounceMs <= 0) {
      onChange(next);
      return;
    }
    timer.current = setTimeout(() => onChange(next), debounceMs);
  }

  const showHotkeyBadge = Boolean(hotkey) && !focused && text.length === 0;

  return (
    <div className={cn('relative', className)}>
      <Search aria-hidden className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        {...props}
        ref={inputRef}
        type='search'
        placeholder={placeholder}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        className={cn('h-9 pl-9', showHotkeyBadge && 'pr-9')}
      />
      {showHotkeyBadge && (
        <Popover open={hintOpen} onOpenChange={setHintOpen}>
          <PopoverTrigger
            type='button'
            aria-label={resolvedTooltip}
            onClick={() => inputRef.current?.focus()}
            onMouseEnter={() => setHintOpen(true)}
            onMouseLeave={() => setHintOpen(false)}
            className='absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
          >
            {hotkey}
          </PopoverTrigger>
          <PopoverContent
            side='top'
            align='end'
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className='w-auto p-2 text-xs text-muted-foreground'
          >
            {resolvedTooltip}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
