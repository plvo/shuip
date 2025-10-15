import type { FieldPath, FieldValues, UseFormRegisterReturn } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface RadioFieldProps<T extends FieldValues> extends React.ComponentProps<typeof RadioGroup> {
  register: UseFormRegisterReturn<FieldPath<T>>;
  options: string[];
  label?: string;
  description?: string;
}

export function RadioField<T extends FieldValues>({
  register,
  options,
  label,
  description,
  ...props
}: RadioFieldProps<T>) {
  return (
    <FormField
      {...register}
      render={({ field, fieldState }) => (
        <FormItem className='space-y-1.5' data-invalid={fieldState.invalid}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
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
