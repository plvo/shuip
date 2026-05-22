'use client';

import type { Locale } from 'date-fns';
import { format, setHours, setMinutes } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { cn } from '@/lib/utils';

export interface DatetimeFieldProps {
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
  label,
  description,
  placeholder = 'Pick a date & time',
  minDate,
  maxDate,
  locale,
  disabled,
  step = 60,
}: DatetimeFieldProps) {
  const field = useFieldContext<Date | undefined>();
  const { isValid, errors } = field.state.meta;
  const [open, setOpen] = React.useState(false);

  const value = field.state.value;

  const handleDateSelect = (next: Date | undefined) => {
    if (!next) {
      field.handleChange(undefined);
      return;
    }
    const hours = value?.getHours() ?? 0;
    const minutes = value?.getMinutes() ?? 0;
    field.handleChange(setMinutes(setHours(next, hours), minutes));
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (!raw) return;
    const [h, m] = raw.split(':').map((part) => Number.parseInt(part, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    const base = value ?? new Date();
    field.handleChange(setMinutes(setHours(base, h), m));
  };

  const triggerLabel = value ? format(value, 'PPp', locale ? { locale } : undefined) : placeholder;

  return (
    <Field className='gap-2' data-invalid={!isValid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={field.name}
            type='button'
            variant='outline'
            disabled={disabled}
            aria-invalid={!isValid}
            className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
            onBlur={field.handleBlur}
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
      {!isValid && (
        <FieldError
          className='text-xs text-left'
          errors={errors.map((error) => ({ message: typeof error === 'string' ? error : error?.message }))}
        />
      )}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
