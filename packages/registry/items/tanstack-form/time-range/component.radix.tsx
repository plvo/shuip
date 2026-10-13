'use client';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';
import {
  addOneHour,
  HOUR_OPTIONS,
  isHourDisabled,
  isMinuteDisabled,
  joinTime,
  MINUTE_OPTIONS,
  nextSlot,
  splitTime,
  type TimeRangeValue,
} from '@/lib/time';

interface TimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  disabled?: boolean;
  invalid?: boolean;
}

function TimePicker({ id, value, onChange, min, disabled, invalid }: TimePickerProps) {
  const { hour, minute } = splitTime(value);
  const bounds = { min };

  return (
    <div className='flex items-center gap-2'>
      <Select value={hour} onValueChange={(h) => onChange(joinTime(h, minute))} disabled={disabled}>
        <SelectTrigger id={id} aria-invalid={invalid} className='w-full'>
          <SelectValue placeholder='HH' />
        </SelectTrigger>
        <SelectContent>
          {HOUR_OPTIONS.map((h) => (
            <SelectItem key={h} value={h} disabled={isHourDisabled(h, bounds)}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className='text-muted-foreground'>:</span>
      <Select value={minute} onValueChange={(m) => onChange(joinTime(hour, m))} disabled={disabled}>
        <SelectTrigger aria-invalid={invalid} className='w-full'>
          <SelectValue placeholder='mm' />
        </SelectTrigger>
        <SelectContent>
          {MINUTE_OPTIONS.map((m) => (
            <SelectItem key={m} value={m} disabled={isMinuteDisabled(m, hour, bounds)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export interface TimeRangeFieldProps {
  label?: string;
  description?: string;
  startLabel?: string;
  endLabel?: string;
  disabled?: boolean;
  fieldProps?: React.ComponentProps<typeof Field>;
}

export function TimeRangeField({
  label,
  description,
  startLabel = 'Start',
  endLabel = 'End',
  disabled,
  fieldProps,
}: TimeRangeFieldProps) {
  const field = useFieldContext<TimeRangeValue>();
  const { isValid, errors } = field.state.meta;
  const value: TimeRangeValue = field.state.value ?? { start: '', end: '' };

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <div className='flex flex-1 flex-col gap-1'>
          <FieldLabel htmlFor={`${field.name}-start`} className='text-xs'>
            {startLabel}
          </FieldLabel>
          <TimePicker
            id={`${field.name}-start`}
            value={value.start}
            onChange={(start) => field.handleChange({ start, end: addOneHour(start) })}
            disabled={disabled}
            invalid={!isValid}
          />
        </div>
        <div className='flex flex-1 flex-col gap-1'>
          <FieldLabel htmlFor={`${field.name}-end`} className='text-xs'>
            {endLabel}
          </FieldLabel>
          <TimePicker
            id={`${field.name}-end`}
            value={value.end}
            onChange={(end) => field.handleChange({ ...value, end })}
            min={value.start ? nextSlot(value.start) : undefined}
            disabled={disabled}
            invalid={!isValid}
          />
        </div>
      </div>
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
