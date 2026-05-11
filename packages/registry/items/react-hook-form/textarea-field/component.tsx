import { InfoIcon } from 'lucide-react';
import type * as React from 'react';
import type { FieldPath, FieldValues, UseFormRegisterReturn } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface TextareaFieldProps<T extends FieldValues> extends React.ComponentProps<typeof InputGroupTextarea> {
  register: UseFormRegisterReturn<FieldPath<T>>;
  label?: string;
  description?: string;
  tooltip?: React.ReactNode;
}

export function TextareaField<T extends FieldValues>({
  register,
  label,
  description,
  tooltip,
  ...props
}: TextareaFieldProps<T>) {
  return (
    <FormField
      {...register}
      render={({ field, fieldState }) => {
        return (
          <FormItem data-invalid={fieldState.invalid}>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <InputGroup>
                <InputGroupTextarea {...field} aria-invalid={fieldState.invalid} {...props} />
                {tooltip && (
                  <InputGroupAddon align='block-end' className='justify-end'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InputGroupButton aria-label='Info' size='icon-xs'>
                          <InfoIcon />
                        </InputGroupButton>
                      </TooltipTrigger>
                      <TooltipContent>{tooltip}</TooltipContent>
                    </Tooltip>
                  </InputGroupAddon>
                )}
              </InputGroup>
            </FormControl>
            <FormMessage className='text-xs text-left' />
            {description && <FormDescription className='text-xs'>{description}</FormDescription>}
          </FormItem>
        );
      }}
    />
  );
}
