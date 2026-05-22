'use client';

import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { Matcher } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { cn } from '@/lib/utils';

export interface MonthFieldProps {
  label?: string;
  description?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  locale?: Locale;
  disabled?: boolean;
  fieldProps?: React.ComponentProps<typeof Field>;
  className?: string;
}

const toFirstOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

export function MonthField({
  label,
  description,
  placeholder = 'Pick a month',
  minDate,
  maxDate,
  locale,
  disabled,
  fieldProps,
  className,
}: MonthFieldProps) {
  const field = useFieldContext<Date | undefined>();
  const { isValid, errors } = field.state.meta;
  const [open, setOpen] = React.useState(false);

  const value = field.state.value;

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      field.handleChange(undefined);
      return;
    }
    field.handleChange(toFirstOfMonth(date));
    setOpen(false);
  };

  const disabledMatchers: Matcher[] = [];
  if (minDate) disabledMatchers.push({ before: minDate });
  if (maxDate) disabledMatchers.push({ after: maxDate });

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={field.name}
            type='button'
            variant='outline'
            disabled={disabled}
            onBlur={field.handleBlur}
            aria-invalid={!isValid}
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
