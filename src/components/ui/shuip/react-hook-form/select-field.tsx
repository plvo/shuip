import type { SelectProps } from '@radix-ui/react-select';
import type { FieldPath, FieldValues, UseFormRegisterReturn } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Key is the label, value is the value
 * @example
 * const options: SelectFieldOption = {
 *   'First': '1',
 *   'Second': '2',
 *   'Third': '3',
 * };
 */
export type SelectFieldOption = Record<string, string>;

export interface SelectFieldProps<TFieldValues extends FieldValues> extends SelectProps {
  register: UseFormRegisterReturn<FieldPath<TFieldValues>>;
  options: SelectFieldOption;
  label?: string;
  placeholder?: string;
  description?: string;
  defaultValue?: TFieldValues[FieldPath<TFieldValues>];
}

export function SelectField<TFieldValues extends FieldValues>({
  register,
  options,
  label,
  description,
  placeholder,
  defaultValue,
  ...props
}: SelectFieldProps<TFieldValues>) {
  return (
    <FormField
      {...register}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <FormItem data-invalid={fieldState.invalid}>
          {label && <FormLabel>{label}</FormLabel>}
          <Select defaultValue={field.value} onValueChange={field.onChange} {...props}>
            <FormControl>
              <SelectTrigger aria-invalid={fieldState.invalid}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.entries(options).map(([label, value]) => (
                <SelectItem key={label} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage className='text-xs text-left' />
          {description && <FormDescription className='text-xs'>{description}</FormDescription>}
        </FormItem>
      )}
    />
  );
}
