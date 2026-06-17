'use client';

import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { ComboboxField, type ComboboxOption } from '@/components/ui/shuip/react-hook-form/combobox-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const USERS: ComboboxOption[] = [
  { value: 'u1', label: 'Ada Lovelace', sublabel: 'ada@example.com' },
  { value: 'u2', label: 'Alan Turing', sublabel: 'alan@example.com' },
  { value: 'u3', label: 'Grace Hopper', sublabel: 'grace@example.com' },
  { value: 'u4', label: 'Katherine Johnson', sublabel: 'katherine@example.com' },
  { value: 'u5', label: 'Margaret Hamilton', sublabel: 'margaret@example.com' },
  { value: 'u6', label: 'Linus Torvalds', sublabel: 'linus@example.com' },
];

const RECENT_IDS = ['u3', 'u1'];

async function searchUsers(query: string): Promise<ComboboxOption[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (!query) return USERS.filter((user) => RECENT_IDS.includes(user.value));
  return USERS.filter((user) => user.label.toLowerCase().includes(query.toLowerCase()));
}

const zodSchema = z.object({
  assignee: z.string().nonempty({ message: 'Assignee is required' }),
});

type Values = z.infer<typeof zodSchema>;

export default function ComboboxFieldAsyncExample() {
  const form = useForm<Values>({ defaultValues: { assignee: '' }, resolver: zodResolver(zodSchema) });
  const lens = useLens({ control: form.control });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => alert(`Assignee: ${values.assignee}`))} className='space-y-4'>
        <ComboboxField
          lens={lens.focus('assignee')}
          label='Assignee'
          description='Empty query returns recents; typing searches'
          placeholder='Search a user…'
          onSearch={searchUsers}
          maxResults={5}
        />
        <SubmitButton>Submit</SubmitButton>
      </form>
    </Form>
  );
}
