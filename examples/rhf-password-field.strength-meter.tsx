'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { PasswordField } from '@/components/ui/shuip/react-hook-form/password-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';
import { cn } from '@/lib/utils';

// Calculate password strength score (0-4)
function calculatePasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

  return Math.min(strength, 4);
}

function getStrengthLabel(strength: number): { label: string; color: string } {
  const labels = [
    { label: 'Very Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-lime-500' },
    { label: 'Strong', color: 'bg-green-500' },
  ];
  return labels[strength] || labels[0];
}

const zodSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include uppercase letter')
      .regex(/[a-z]/, 'Must include lowercase letter')
      .regex(/[0-9]/, 'Must include number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must include special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function RhfPasswordFieldStrengthMeterExample() {
  const form = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(zodSchema),
  });

  const password = form.watch('password');
  const strength = password ? calculatePasswordStrength(password) : 0;
  const { label, color } = getStrengthLabel(strength);

  async function onSubmit(_values: z.infer<typeof zodSchema>) {
    try {
      alert(`Account created with password strength: ${label}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <div className='space-y-2'>
          <PasswordField
            register={form.register('password')}
            label='Password'
            tooltip={
              <div className='space-y-1'>
                <p className='font-semibold'>Password must contain:</p>
                <ul className='list-disc list-inside text-sm space-y-0.5'>
                  <li>At least 8 characters (12+ recommended)</li>
                  <li>Uppercase and lowercase letters</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </div>
            }
            placeholder='Enter password'
          />

          {/* Strength meter */}
          {password && (
            <div className='space-y-1.5'>
              <div className='flex gap-1'>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={cn('h-1 flex-1 rounded-full transition-colors', i < strength ? color : 'bg-muted')}
                  />
                ))}
              </div>
              <p className='text-sm text-muted-foreground'>
                Strength: <span className='font-medium'>{label}</span>
              </p>
            </div>
          )}
        </div>

        <PasswordField
          register={form.register('confirmPassword')}
          label='Confirm Password'
          placeholder='Re-enter password'
        />

        <SubmitButton>Create Account</SubmitButton>
      </form>
    </Form>
  );
}
