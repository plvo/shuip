import type { Lens } from '@hookform/lenses';
import type { SelectProps } from '@radix-ui/react-select';
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

export interface SelectFieldProps extends Omit<SelectProps, 'value' | 'defaultValue' | 'onValueChange'> {
  lens: Lens<string>;
  options: SelectFieldOption;
  label?: string;
  placeholder?: string;
  description?: string;
}

export function SelectField({ lens, options, label, description, placeholder, ...props }: SelectFieldProps) {
  return (
    <FormField
      {...lens.interop()}
      render={({ field, fieldState }) => (
        <FormItem data-invalid={fieldState.invalid}>
          {label && <FormLabel>{label}</FormLabel>}
          <Select {...props} value={field.value ?? ''} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger aria-invalid={fieldState.invalid} className='w-full'>
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
