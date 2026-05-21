import type { Lens } from '@hookform/lenses';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface RadioFieldProps extends React.ComponentProps<typeof RadioGroup> {
  lens: Lens<string>;
  options: string[];
  label?: string;
  description?: string;
}

export function RadioField({ lens, options, label, description, ...props }: RadioFieldProps) {
  return (
    <FormField
      {...lens.interop()}
      render={({ field, fieldState }) => (
        <FormItem className='space-y-1.5' data-invalid={fieldState.invalid}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className='flex flex-col space-y-1'
              aria-invalid={fieldState.invalid}
              {...props}
            >
              {options.map((value) => (
                <FormItem key={value} className='flex items-center space-x-3 space-y-0'>
                  <FormControl>
                    <RadioGroupItem value={value} id={`${field.name}-${value}`} aria-invalid={fieldState.invalid} />
                  </FormControl>
                  <FormLabel htmlFor={`${field.name}-${value}`} className='font-normal'>
                    {value}
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage className='text-xs text-left' />
          {description && <FormDescription className='text-xs'>{description}</FormDescription>}
        </FormItem>
      )}
    />
  );
}
