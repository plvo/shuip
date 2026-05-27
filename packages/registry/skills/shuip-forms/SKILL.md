---
name: shuip-forms
description: Use when building or editing a form in a project that uses shuip — covers shuip's react-hook-form (rhf-) and tanstack-form (tsf-) field components, their install commands, validation, submission, and accessible error/loading state. Use before hand-writing shadcn FormField boilerplate.
---

# Building forms with shuip

## Overview

shuip ships pre-wired form **field components** for two libraries: **react-hook-form** (registry prefix `rhf-`) and **tanstack-form** (prefix `tsf-`). Each field collapses the label / control / error-message / accessibility wiring into one component.

**Core principle:** compose shuip field components — do NOT hand-write shadcn's `<FormField render={...}>` boilerplate. If you're reaching for `FormField`/`FormItem`/`FormControl`/`FormMessage`, you're rebuilding what these items already give you.

There is **no composite "form" item** in the registry — you assemble a form from individual field items plus your own schema and submit handler.

## Choose the library first

Match whatever the project already uses. If it's greenfield:

- **react-hook-form** (`rhf-*`) — mature ecosystem, uncontrolled/minimal re-renders, validates with a zod resolver. Fields bind through a typed **lens** (`@hookform/lenses`). Pick this unless you have a reason not to.
- **tanstack-form** (`tsf-*`) — end-to-end type-safe field names, validators co-located on the field, good async validation. Natural fit if the project is already on the TanStack stack (Query/Router). Requires the `tsf-form-context` item as its foundation.

Do not mix the two families in one form.

## Install

```bash
# react-hook-form fields (install the ones you need)
npx shadcn@latest add "https://shuip.plvo.dev/r/rhf-input-field"
npx shadcn@latest add "https://shuip.plvo.dev/r/rhf-password-field"
npx shadcn@latest add "https://shuip.plvo.dev/r/submit-button"

# tanstack-form: install the form context FIRST, then fields
npx shadcn@latest add "https://shuip.plvo.dev/r/tsf-form-context"
npx shadcn@latest add "https://shuip.plvo.dev/r/tsf-input-field"
npx shadcn@latest add "https://shuip.plvo.dev/r/tsf-submit-button"
```

Field naming follows the input type: `input-field`, `password-field`, `number-field`, `select-field`, `checkbox-field`, `radio-field`, `textarea-field`, `date-field`, `date-range-field`, `datetime-field`, `time-field`, `month-field`, `autocomplete-field`, plus `address-field` (rhf only). For the full catalog use the **shuip-components** skill. The shadcn CLI pulls each item's shadcn primitives and npm deps (react-hook-form / zod / @hookform/lenses, or @tanstack/react-form) automatically.

**Exports are unprefixed.** The item `rhf-input-field` exports `InputField`. The `rhf-`/`tsf-` prefix is only the registry name, never the import symbol.

## react-hook-form pattern

Create one lens per form with `useLens({ control })`, then give each field `lens.focus('fieldName')`. Wrap everything in `<Form {...form}>`.

```tsx
'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { PasswordField } from '@/components/ui/shuip/react-hook-form/password-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const schema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Values = z.infer<typeof schema>;

export function SignupForm() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });
  const lens = useLens({ control: form.control });

  async function onSubmit(values: Values) {
    const result = await signup(values); // a server action
    if (result?.fieldErrors) {
      for (const [name, message] of Object.entries(result.fieldErrors)) {
        form.setError(name as keyof Values, { message });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <InputField lens={lens.focus('email')} label="Email" type="email" placeholder="you@example.com" />
        <PasswordField lens={lens.focus('password')} label="Password" />
        <PasswordField lens={lens.focus('confirmPassword')} label="Confirm password" />
        <SubmitButton loading={form.formState.isSubmitting}>Create account</SubmitButton>
      </form>
    </Form>
  );
}
```

- Field-specific props (`type`, `placeholder`, …) pass straight through to the underlying input.
- `SubmitButton` does **not** auto-disable — bind `loading={form.formState.isSubmitting}` (it disables and shows a spinner while loading).
- Server-side validation failures map back onto fields with `form.setError`.

## tanstack-form pattern

Build the typed form hook once with `createFormHook`, passing the contexts from `tsf-form-context` and your field/form components. Bind fields with `<form.AppField>`; validators live on the field.

```tsx
'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { PasswordField } from '@/components/ui/shuip/tanstack-form/password-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField, PasswordField },
  formComponents: { SubmitButton },
});

export function SignupForm() {
  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      await signup(value); // a server action
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.AppField
        name="email"
        validators={{ onChange: ({ value }) => (!value.includes('@') ? 'Invalid email' : undefined) }}
        children={(field) => <field.InputField label="Email" props={{ type: 'email' }} />}
      />
      <form.AppField
        name="password"
        validators={{ onChange: ({ value }) => (value.length < 8 ? 'At least 8 characters' : undefined) }}
        children={(field) => <field.PasswordField label="Password" />}
      />
      <form.AppForm>
        <form.SubmitButton>Create account</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
```

- tsf fields take split props: `props` for the native input, `fieldProps` for the field wrapper. There is no lens and no `<Form>` wrapper.
- The tsf `SubmitButton` auto-disables via `form.Subscribe` — render it inside `<form.AppForm>`, no `loading` prop needed.

## Accessibility & states (both libraries)

The field components already render `aria-invalid`, associate the error message, and show validation errors — you get accessible errors for free. For a form-level server error, render a `role="alert"` region yourself. Loading/disabled on submit is handled by `SubmitButton` as shown above.

## Common mistakes

| Mistake | Reality |
|---------|---------|
| `<InputField control={form.control} name="email" />` | Wrong API. rhf fields bind via a lens: `lens={lens.focus('email')}` after `const lens = useLens({ control: form.control })`. |
| Importing `RhfInputField` / `TsfInputField` | Export is `InputField`. The `rhf-`/`tsf-` prefix is the registry name only. |
| `@/components/ui/shuip/rhf-input-field` (flat) | Real path is `@/components/ui/shuip/react-hook-form/input-field` (category sub-folder). |
| Installing a `rhf-form` / `tsf-form` item | No composite form item exists. Assemble from field items. |
| Hand-writing `<FormField render={...}>` | That's the boilerplate shuip fields replace. Use the field component. |
| Raw `<Button disabled={isSubmitting}>` | Use `SubmitButton`. rhf: `loading={form.formState.isSubmitting}`; tsf: auto via `form.Subscribe`. |
| Using tsf fields without `tsf-form-context` | Every tsf field reads `useFieldContext`; install and wire `tsf-form-context` first via `createFormHook`. |
| Mixing rhf and tsf fields in one form | Pick one family per form. |

## Red flags — STOP

- About to type `control={...}` or `name="..."` on an rhf shuip field → use the lens.
- About to import a `Rhf*`/`Tsf*`-prefixed symbol → the export is unprefixed.
- About to write `FormField`/`FormItem`/`FormControl` by hand → a shuip field already does this.
- Looking for an `rhf-form` install command → it doesn't exist.
