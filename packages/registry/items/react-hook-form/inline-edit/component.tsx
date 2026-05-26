'use client';

import type { Lens } from '@hookform/lenses';
import { InfoIcon } from 'lucide-react';
import { useController, useFormContext } from 'react-hook-form';
import { Field, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { InlineEdit, type InlineEditProps } from '@/components/ui/shuip/inline-edit';

export interface InlineEditFieldProps
  extends Pick<InlineEditProps, 'input' | 'variant' | 'size' | 'placeholder' | 'canEdit'> {
  lens: Lens<string>;
  onSave?: (next: string) => Promise<void> | void;
  label?: string;
  description?: string;
  orientation?: 'vertical' | 'horizontal';
}

export function InlineEditField({
  lens,
  onSave,
  label,
  description,
  orientation = 'vertical',
  ...props
}: InlineEditFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const { trigger } = useFormContext();

  const handleSave = async (next: string) => {
    field.onChange(next);
    if (await trigger(field.name)) await onSave?.(next);
  };

  return (
    <Field orientation={orientation} className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <div className='flex items-center gap-2'>
        <InlineEdit {...props} value={field.value ?? ''} onSave={handleSave} error={fieldState.error?.message} />
        {description && (
          <Popover>
            <PopoverTrigger aria-label='Info' className='text-muted-foreground transition-colors hover:text-foreground'>
              <InfoIcon className='size-4' />
            </PopoverTrigger>
            <PopoverContent className='w-64 text-sm'>{description}</PopoverContent>
          </Popover>
        )}
      </div>
    </Field>
  );
}
