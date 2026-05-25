'use client';

import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { cn } from '@/lib/utils';

export interface DateRangeFieldProps {
  label?: string;
  description?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  locale?: Locale;
  fieldProps?: React.ComponentProps<typeof Field>;
  triggerProps?: React.ComponentProps<typeof Button>;
}

function formatRange(value: DateRange | undefined, locale: Locale | undefined): string | null {
  if (!value?.from) return null;
  const fromLabel = format(value.from, 'PPP', { locale });
  if (!value.to) return fromLabel;
  return `${fromLabel} – ${format(value.to, 'PPP', { locale })}`;
}

export function DateRangeField({
  label,
  description,
  placeholder = 'Pick a date range',
  minDate,
  maxDate,
  locale,
  fieldProps,
  triggerProps,
}: DateRangeFieldProps) {
  const field = useFieldContext<DateRange | undefined>();
  const { isValid, errors } = field.state.meta;
  const value = field.state.value;
  const [open, setOpen] = React.useState(false);

  const disabledMatcher = React.useMemo(() => {
    if (!minDate && !maxDate) return undefined;
    return { ...(minDate ? { before: minDate } : {}), ...(maxDate ? { after: maxDate } : {}) };
  }, [minDate, maxDate]);

  const triggerLabel = formatRange(value, locale);

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={field.name}
            type='button'
            variant='outline'
            onBlur={field.handleBlur}
            aria-invalid={!isValid}
            {...triggerProps}
            className={cn(
              'w-full justify-between font-normal',
              !triggerLabel && 'text-muted-foreground',
              triggerProps?.className,
            )}
          >
            <span className='truncate'>{triggerLabel ?? placeholder}</span>
            <CalendarIcon className='size-4 opacity-60' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='range'
            selected={value}
            onSelect={(range) => field.handleChange(range)}
            numberOfMonths={2}
            defaultMonth={value?.from ?? minDate}
            disabled={disabledMatcher}
            locale={locale}
            autoFocus
          />
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
