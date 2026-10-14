'use client';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { HOUR_OPTIONS, isHourDisabled, isMinuteDisabled, joinTime, MINUTE_OPTIONS, splitTime } from '@/lib/time';

export function timePartHandlers(time: string, onChange: (time: string) => void) {
  const { hour, minute } = splitTime(time);
  return {
    onHourChange: (next: string | null) => onChange(next === null ? '' : joinTime(next, minute)),
    onMinuteChange: (next: string | null) => onChange(next === null ? '' : joinTime(hour, next)),
  };
}

export interface TimeFieldProps {
  label?: string;
  description?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  fieldProps?: React.ComponentProps<typeof Field>;
}

export function TimeField({ label, description, min, max, disabled, fieldProps }: TimeFieldProps) {
  const field = useFieldContext<string>();
  const { isValid, errors } = field.state.meta;
  const time = field.state.value ?? '';
  const { hour, minute } = splitTime(time);
  const { onHourChange, onMinuteChange } = timePartHandlers(time, field.handleChange);
  const bounds = { min, max };

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <div className='flex items-center gap-2'>
        <Select value={hour} onValueChange={onHourChange} disabled={disabled}>
          <SelectTrigger id={field.name} aria-invalid={!isValid} className='w-full'>
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
        <Select value={minute} onValueChange={onMinuteChange} disabled={disabled}>
          <SelectTrigger aria-invalid={!isValid} className='w-full'>
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
