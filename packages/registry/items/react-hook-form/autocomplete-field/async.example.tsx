'use client';

import { useLens } from '@hookform/lenses';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { AutocompleteField } from '@/components/ui/shuip/react-hook-form/autocomplete-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Blackberry', 'Blueberry', 'Cherry', 'Mango', 'Melon', 'Orange', 'Peach'];

async function searchFruits(query: string): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return FRUITS.filter((fruit) => fruit.toLowerCase().includes(query.toLowerCase()));
}

const zodSchema = z.object({
  fruit: z.string(),
});

type Values = z.infer<typeof zodSchema>;

export default function AutocompleteFieldAsyncExample() {
  const form = useForm<Values>({ defaultValues: { fruit: '' } });
  const lens = useLens({ control: form.control });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => alert(values.fruit))} className='space-y-4'>
        <AutocompleteField
          lens={lens.focus('fruit')}
          label='Fruit'
          description='Async search with simulated latency'
          placeholder='Search a fruit…'
          onSearch={searchFruits}
        />
        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
