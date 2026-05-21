'use client';

import { createFormHook, useStore } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { PasswordField } from '@/components/ui/shuip/tanstack-form/password-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';
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

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { PasswordField },
  formComponents: { SubmitButton },
});

export default function TsfPasswordFieldStrengthMeterExample() {
  const form = useAppForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  // Subscribe to password value changes
  const password = useStore(form.store, (state) => state.values.password);
  const strength = password ? calculatePasswordStrength(password) : 0;
  const { label, color } = getStrengthLabel(strength);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <div className='space-y-2'>
        <form.AppField
          name='password'
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Password is required';
              if (value.length < 8) return 'Password must be at least 8 characters';
              if (!/[A-Z]/.test(value)) return 'Must include uppercase letter';
              if (!/[a-z]/.test(value)) return 'Must include lowercase letter';
              if (!/[0-9]/.test(value)) return 'Must include number';
              if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Must include special character';
              return undefined;
            },
          }}
          children={(field) => (
            <field.PasswordField
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
              props={{ placeholder: 'Enter password' }}
            />
          )}
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

      <form.AppField
        name='confirmPassword'
        validators={{
          onChangeListenTo: ['password'],
          onChange: ({ value, fieldApi }) => {
            const pwd = fieldApi.form.getFieldValue('password');
            if (!value) return 'Please confirm your password';
            if (value !== pwd) return 'Passwords do not match';
            return undefined;
          },
        }}
        children={(field) => (
          <field.PasswordField label='Confirm Password' props={{ placeholder: 'Re-enter password' }} />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Create Account</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
