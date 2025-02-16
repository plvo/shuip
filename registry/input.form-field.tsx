'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Control, Path } from 'react-hook-form';

const InputField = <TFieldValues extends Record<string, string>>({
  control,
  name,
  label,
  description,
  ...props
}: {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  description?: string;
} & React.ComponentProps<typeof Input>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        if (!field) {
          console.error('Field is missing for InputField', name);
          return <></>;
        }

        return (
          <FormItem className="space-y-1.5">
            <FormLabel className="flex items-center justify-between">
              {label}
              <FormMessage className="max-sm:hidden text-sm" />
            </FormLabel>
            <FormControl>
              <Input {...field} {...props} />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage className="sm:hidden text-xs text-left" />
          </FormItem>
        );
      }}
    />
  );
};

export default InputField;
