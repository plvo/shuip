'use client';

import type { Lens } from '@hookform/lenses';
import { format } from 'date-fns';
import type { Locale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { Matcher } from 'react-day-picker';
import { useController } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateFieldProps {
  lens: Lens<Date | undefined>;
  label?: string;
  description?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  locale?: Locale;
  disabled?: boolean;
  dateFormat?: string;
  triggerProps?: React.ComponentProps<typeof Button>;
}

export function DateField({
  lens,
  label,
  description,
  placeholder = 'Pick a date',
  minDate,
  maxDate,
  locale = enUS,
  disabled,
  dateFormat = 'PPP',
  triggerProps,
}: DateFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const [open, setOpen] = React.useState(false);

  const value = field.value as Date | undefined;
  const disabledMatchers: Matcher[] = [];
  if (minDate) disabledMatchers.push({ before: minDate });
  if (maxDate) disabledMatchers.push({ after: maxDate });

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            id={field.name}
            variant='outline'
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            onBlur={field.onBlur}
            {...triggerProps}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground',
              triggerProps?.className,
            )}
          >
            <span>{value ? format(value, dateFormat, { locale }) : placeholder}</span>
            <CalendarIcon className='size-4 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={value}
            onSelect={(date) => {
              field.onChange(date);
              setOpen(false);
            }}
            disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
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
