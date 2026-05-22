'use client';

import type { Lens } from '@hookform/lenses';
import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { Matcher } from 'react-day-picker';
import { useController } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface MonthFieldProps {
  lens: Lens<Date | undefined>;
  label?: string;
  description?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  locale?: Locale;
  disabled?: boolean;
  className?: string;
}

const toFirstOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

export function MonthField({
  lens,
  label,
  description,
  placeholder = 'Pick a month',
  minDate,
  maxDate,
  locale,
  disabled,
  className,
}: MonthFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const [open, setOpen] = React.useState(false);

  const value: Date | undefined = field.value;

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      field.onChange(undefined);
      return;
    }
    field.onChange(toFirstOfMonth(date));
    setOpen(false);
  };

  const disabledMatchers: Matcher[] = [];
  if (minDate) disabledMatchers.push({ before: minDate });
  if (maxDate) disabledMatchers.push({ after: maxDate });

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
            className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground', className)}
          >
            {value ? format(value, 'MMMM yyyy', { locale }) : placeholder}
            <CalendarIcon className='size-4 opacity-60' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            captionLayout='dropdown'
            selected={value}
            onSelect={handleSelect}
            disabled={disabledMatchers.length ? disabledMatchers : undefined}
            startMonth={minDate}
            endMonth={maxDate}
            defaultMonth={value ?? minDate}
            locale={locale}
          />
        </PopoverContent>
      </Popover>
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
