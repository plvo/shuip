'use client';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import type { ControllerRenderProps, FieldPath, FieldValues, UseFormRegisterReturn } from 'react-hook-form';

export interface InputFieldProps<T extends FieldValues> extends React.ComponentProps<typeof Input> {
  register: UseFormRegisterReturn<FieldPath<T>>;
  label?: string;
  description?: string;
}

export function InputField<T extends FieldValues>({ register, label, description, ...props }: InputFieldProps<T>) {
  const [showPassword, setShowPassword] = React.useState(false);

  const getInputType = () => {
    if (props.type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return props.type ?? 'text';
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: ControllerRenderProps<FieldValues, FieldPath<FieldValues>>,
  ) => {
    const value = e.target.value;
    if (props.type === 'number') return field.onChange(value === '' ? '' : Number(value));
    if (props.type === 'date') return field.onChange(value === '' ? '' : new Date(value));
    return field.onChange(value);
  };

  return (
    <FormField
      {...register}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel className='flex items-center justify-between'>
              {label}
              <FormMessage className='max-sm:hidden text-xs opacity-80' />
            </FormLabel>
            <FormControl>
              <div className='relative'>
                <Input {...field} {...props} type={getInputType()} onChange={(e) => onChange(e, field)} />
                {props.type === 'password' && (
                  <PasswordButton showPassword={showPassword} setShowPassword={setShowPassword} />
                )}
              </div>
            </FormControl>
            {description && <p className='text-muted-foreground text-xs'>{description}</p>}
            <FormMessage className='sm:hidden text-xs text-left opacity-80' />
          </FormItem>
        );
      }}
    />
  );
}

interface PasswordButtonProps {
  showPassword: boolean;
  setShowPassword: (showPassword: boolean) => void;
}

function PasswordButton({ showPassword, setShowPassword }: PasswordButtonProps) {
  return (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
      onClick={() => setShowPassword(!showPassword)}
      tabIndex={-1}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff className='size-4' aria-hidden='true' /> : <Eye className='size-4' aria-hidden='true' />}
      <span className='sr-only'>{showPassword ? 'Hide password' : 'Show password'}</span>
    </Button>
  );
}
