import type { Lens } from '@hookform/lenses';
import { InfoIcon } from 'lucide-react';
import type * as React from 'react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface InputFieldProps<T extends string | number = string>
  extends Omit<React.ComponentProps<typeof InputGroupInput>, 'value' | 'onChange'> {
  lens: Lens<T>;
  label?: string;
  description?: string;
  tooltip?: React.ReactNode;
}

export function InputField<T extends string | number = string>({
  lens,
  label,
  description,
  tooltip,
  ...props
}: InputFieldProps<T>) {
  return (
    <FormField
      {...lens.interop()}
      render={({ field, fieldState }) => {
        const isNumeric = props.type === 'number' || props.type === 'range' || typeof field.value === 'number';
        const value = typeof field.value === 'number' && Number.isNaN(field.value) ? '' : field.value;
        const type = props.type ?? (isNumeric ? 'number' : 'text');

        return (
          <FormItem data-invalid={fieldState.invalid}>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <InputGroup>
                <InputGroupInput
                  {...field}
                  {...props}
                  type={type}
                  value={value}
                  onChange={(e) => field.onChange(isNumeric ? e.target.valueAsNumber : e.target.value)}
                  aria-invalid={fieldState.invalid}
                />
                {tooltip && (
                  <InputGroupAddon align='inline-end'>
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
