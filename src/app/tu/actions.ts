'use server';

import { createServerValidate, ServerValidateError } from '@tanstack/react-form/nextjs';
import { opts } from './page';

const serverValidate = createServerValidate({
  ...opts,
  onServerValidate: ({ value }) => {
    if (value.name.length < 12) {
      return 'Server validation: You must be at least 12 to sign up';
    }
  },
});

export async function mutaction(prev: unknown, data: FormData) {
  try {
    const validated = await serverValidate(data);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(validated);
    return validated;
  } catch (error) {
    if (error instanceof ServerValidateError) {
      throw error;
    }
    throw error;
  }
}

export async function getData() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    name: 'John Doe',
  };
}
