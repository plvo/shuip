'use client';

import type { Lens } from '@hookform/lenses';
import type { Locale } from 'date-fns';
import { format, setHours, setMinutes } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { useController } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DatetimeFieldProps {
  lens: Lens<Date | undefined>;
  label?: string;
  description?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  locale?: Locale;
  disabled?: boolean;
  step?: number;
}

const pad2 = (n: number): string => n.toString().padStart(2, '0');

const toTimeInputValue = (date: Date | undefined): string =>
  date ? `${pad2(date.getHours())}:${pad2(date.getMinutes())}` : '';

export function DatetimeField({
  lens,
  label,
  description,
  placeholder = 'Pick a date & time',
  minDate,
  maxDate,
  locale,
  disabled,
  step = 60,
}: DatetimeFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const [open, setOpen] = React.useState(false);

  const value = field.value as Date | undefined;

  const handleDateSelect = (next: Date | undefined) => {
    if (!next) {
      field.onChange(undefined);
      return;
    }
    const hours = value?.getHours() ?? 0;
    const minutes = value?.getMinutes() ?? 0;
    field.onChange(setMinutes(setHours(next, hours), minutes));
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (!raw) return;
    const [h, m] = raw.split(':').map((part) => Number.parseInt(part, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    const base = value ?? new Date();
    field.onChange(setMinutes(setHours(base, h), m));
  };

  const triggerLabel = value ? format(value, 'PPp', locale ? { locale } : undefined) : placeholder;

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={field.name}
            type='button'
            variant='outline'
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
            onBlur={field.onBlur}
          >
            <span className='truncate'>{triggerLabel}</span>
            <CalendarIcon className='size-4 opacity-70' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='flex w-auto flex-col gap-3 p-3' align='start'>
          <Calendar
            mode='single'
            selected={value}
            onSelect={handleDateSelect}
            disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
            locale={locale}
            autoFocus
          />
          <InputGroup>
            <InputGroupInput
              type='time'
              step={step}
              value={toTimeInputValue(value)}
              onChange={handleTimeChange}
              aria-label='Time'
            />
          </InputGroup>
          <Button type='button' size='sm' onClick={() => setOpen(false)}>
            OK
          </Button>
        </PopoverContent>
      </Popover>
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
