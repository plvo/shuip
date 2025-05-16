import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Control, Path, PathValue } from 'react-hook-form';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps<T extends Record<string, string>> {
  control: Control<T>;
  name: Path<T>;
  values: SelectOption[];
  defaultValues?: PathValue<T, Path<T>>;
  label: string;
  placeholder: string;
  description?: string;
}

export const SelectField = <TFieldValues extends Record<string, string>>({
  control,
  name,
  values,
  defaultValues,
  label,
  placeholder,
  description,
}: SelectFieldProps<TFieldValues>) => {
  return (
    <FormField
      control={control}
      name={name}
      defaultValue={defaultValues}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
};
