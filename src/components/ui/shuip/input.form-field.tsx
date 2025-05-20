'use client';

import type React from 'react';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Control, Path } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type InputFieldProps<T extends Record<string, any>> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  isNumber?: boolean;
} & React.ComponentProps<typeof Input>;

const InputField = <TFieldValues extends Record<string, any>>({
  control,
  name,
  label,
  description,
  isNumber = false,
  ...props
}: InputFieldProps<TFieldValues>) => {
  const [showPassword, setShowPassword] = useState(false);

  const getInputType = () => {
    if (isNumber) return 'number';
    if (props.type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return props.type ?? 'text';
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem className='space-y-1.5'>
            <FormLabel className='flex items-center justify-between'>
              {label}
              <FormMessage className='max-sm:hidden text-sm' />
            </FormLabel>
            <FormControl>
              <div className='relative'>
                <Input
                  {...field}
                  {...props}
                  type={getInputType()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isNumber) return field.onChange(value === '' ? '' : Number(value));
                    return field.onChange(value);
                  }}
                />
                {props.type === 'password' && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' aria-hidden='true' />
                    ) : (
                      <Eye className='h-4 w-4' aria-hidden='true' />
                    )}
                    <span className='sr-only'>
                      {showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    </span>
                  </Button>
                )}
              </div>
            </FormControl>
            {description && <p className='text-muted-foreground text-sm'>{description}</p>}
            <FormMessage className='sm:hidden text-xs text-left' />
          </FormItem>
        );
      }}
    />
  );
};

export default InputField;
