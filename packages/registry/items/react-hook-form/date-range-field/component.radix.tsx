'use client';

import type { Lens } from '@hookform/lenses';
import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { useController } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRangeFieldProps {
  lens: Lens<DateRange | undefined>;
  label?: string;
  description?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  locale?: Locale;
  disabled?: boolean;
}

function formatRange(value: DateRange | undefined, locale: Locale | undefined): string | null {
  if (!value?.from) return null;
  const fromLabel = format(value.from, 'PPP', { locale });
  if (!value.to) return fromLabel;
  return `${fromLabel} – ${format(value.to, 'PPP', { locale })}`;
}

export function DateRangeField({
  lens,
  label,
  description,
  placeholder = 'Pick a date range',
  minDate,
  maxDate,
  locale,
  disabled,
}: DateRangeFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const value = field.value as DateRange | undefined;
  const [open, setOpen] = React.useState(false);

  const disabledMatcher = React.useMemo(() => {
    if (!minDate && !maxDate) return undefined;
    return { ...(minDate ? { before: minDate } : {}), ...(maxDate ? { after: maxDate } : {}) };
  }, [minDate, maxDate]);

  const triggerLabel = formatRange(value, locale);

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
            onBlur={field.onBlur}
            aria-invalid={fieldState.invalid}
            className={cn('w-full justify-between font-normal', !triggerLabel && 'text-muted-foreground')}
          >
            <span className='truncate'>{triggerLabel ?? placeholder}</span>
            <CalendarIcon className='size-4 opacity-60' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='range'
            selected={value}
            onSelect={(range) => field.onChange(range)}
            numberOfMonths={2}
            defaultMonth={value?.from ?? minDate}
            disabled={disabledMatcher}
            locale={locale}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
