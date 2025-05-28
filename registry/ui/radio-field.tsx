import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Control, Path } from 'react-hook-form';

export interface RadioFieldProps<T extends Record<string, string>> extends React.ComponentProps<typeof RadioGroup> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  values: string[];
}

export function RadioField<TFieldValues extends Record<string, string>>({
  control,
  name,
  label,
  description,
  values,
  ...props
}: RadioFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
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
              {values.map((value: any) => (
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
