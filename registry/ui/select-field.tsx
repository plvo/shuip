import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SelectProps } from '@radix-ui/react-select';
import type { Control, Path, PathValue } from 'react-hook-form';

export interface SelectFieldOption {
  value: string;
  label: string;
}

export interface SelectFieldProps<T extends Record<string, any>> extends SelectProps {
  control: Control<T>;
  name: Path<T>;
  values: SelectFieldOption[];
  label: string;
  placeholder?: string;
  description?: string;
  defaultValues?: PathValue<T, Path<T>>;
}

export function SelectField<T extends Record<string, any>>({
  control,
  name,
  values,
  defaultValues,
  label,
  placeholder,
  description,
  ...props
}: SelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      defaultValue={defaultValues}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value} {...props}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {values.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
