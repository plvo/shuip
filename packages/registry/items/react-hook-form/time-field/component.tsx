'use client';

import type { Lens } from '@hookform/lenses';
import { useController } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HOUR_OPTIONS, isHourDisabled, isMinuteDisabled, joinTime, MINUTE_OPTIONS, splitTime } from '@/lib/time';

export interface TimeFieldProps {
  lens: Lens<string>;
  label?: string;
  description?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}

export function TimeField({ lens, label, description, min, max, disabled }: TimeFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const { hour, minute } = splitTime(field.value ?? '');
  const bounds = { min, max };

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <div className='flex items-center gap-2'>
        <Select value={hour} onValueChange={(h) => field.onChange(joinTime(h, minute))} disabled={disabled}>
          <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className='w-full'>
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
        <Select value={minute} onValueChange={(m) => field.onChange(joinTime(hour, m))} disabled={disabled}>
          <SelectTrigger aria-invalid={fieldState.invalid} className='w-full'>
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
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
