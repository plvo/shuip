import type { FieldPath, FieldValues, UseFormRegisterReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export interface CheckboxFieldProps<T extends FieldValues> extends React.ComponentProps<typeof Checkbox> {
  register: UseFormRegisterReturn<FieldPath<T>>;
  label: string;
  boxLabel?: string;
  description?: string;
}

export function CheckboxField<T extends FieldValues>({
  register,
  label,
  description,
  ...props
}: CheckboxFieldProps<T>) {
  return (
    <FormField
      {...register}
      render={({ field, fieldState }) => {
        return (
          <FormItem data-invalid={fieldState.invalid}>
            <FormControl>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id={field.name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                  {...props}
                />
                <FormLabel htmlFor={field.name}>{label}</FormLabel>
              </div>
            </FormControl>
            <FormMessage className='text-xs text-left' />
            {description && <FormDescription className='text-xs'>{description}</FormDescription>}
          </FormItem>
        );
      }}
    />
  );
}

export default CheckboxField;
