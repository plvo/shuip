'use client';

import { InfoIcon } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { InlineEdit, type InlineEditProps } from '@/components/ui/shuip/inline-edit';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';

export interface InlineEditFieldProps
  extends Pick<InlineEditProps, 'input' | 'variant' | 'size' | 'placeholder' | 'canEdit'> {
  onSave?: (next: string) => Promise<void> | void;
  label?: string;
  description?: string;
  orientation?: 'vertical' | 'horizontal';
}

export function InlineEditField({
  onSave,
  label,
  description,
  orientation = 'vertical',
  ...props
}: InlineEditFieldProps) {
  const field = useFieldContext<string>();
  const { isValid, errors } = field.state.meta;
  const errorMessage = isValid ? undefined : typeof errors[0] === 'string' ? errors[0] : errors[0]?.message;

  const handleSave = async (next: string) => {
    field.handleChange(next);
    if (field.state.meta.isValid) await onSave?.(next);
  };

  return (
    <Field orientation={orientation} className='gap-2' data-invalid={!isValid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <div className='flex items-center gap-2'>
        <InlineEdit {...props} value={field.state.value ?? ''} onSave={handleSave} error={errorMessage} />
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
