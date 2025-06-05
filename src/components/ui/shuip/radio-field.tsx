import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { FieldPath, FieldValues, UseFormRegisterReturn } from 'react-hook-form';

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
      render={({ field }) => (
        <FormItem className='space-y-1.5'>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className='flex flex-col space-y-1'
              {...props}
            >
              {options.map((value: any) => (
                <FormItem key={value} className='flex items-center space-x-3 space-y-0'>
                  <FormControl>
                    <RadioGroupItem value={value} />
                  </FormControl>
                  <FormLabel className='font-normal'>{value}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage className='sm:hidden text-xs text-left' />
        </FormItem>
      )}
    />
  );
}
