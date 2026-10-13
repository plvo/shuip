'use client';

import { createFormHook } from '@tanstack/react-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
} from '@/components/ui/shuip/tanstack-form/form-context';

function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>();
  const { isValid, errors } = field.state.meta;
  return (
    <Field data-invalid={!isValid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={!isValid}
      />
      {!isValid && (
        <FieldError errors={errors.map((error) => ({ message: typeof error === 'string' ? error : error?.message }))} />
      )}
    </Field>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <Button type='submit' disabled={!canSubmit}>
          {isSubmitting ? 'Submitting…' : children}
        </Button>
      )}
    </form.Subscribe>
  );
}

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: { SubmitButton },
});

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

export default function FormContextExample() {
  const form = useAppForm({
    defaultValues: { username: '' },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='flex flex-col gap-3'
    >
      <form.AppField name='username' children={(field) => <field.TextField label='Username' />} />
      <form.AppForm>
        <form.SubmitButton>Submit</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
