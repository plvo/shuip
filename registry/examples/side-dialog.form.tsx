'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import {
  SideDialog,
  SideDialogClose,
  SideDialogContent,
  SideDialogDescription,
  SideDialogFooter,
  SideDialogHeader,
  SideDialogTitle,
  SideDialogTrigger,
} from '@/components/ui/shuip/side-dialog';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export default function SideDialogSimpleExample() {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    alert(`Form submitted: ${JSON.stringify(data)}`);
    setOpen(false);
    form.reset();
  };

  return (
    <SideDialog open={open} onOpenChange={setOpen}>
      <SideDialogTrigger asChild>
        <Button variant='outline'>Open Form Side Dialog</Button>
      </SideDialogTrigger>
      <SideDialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <SideDialogHeader>
              <SideDialogTitle>Form Side Dialog</SideDialogTitle>
              <SideDialogDescription>This is a form side dialog.</SideDialogDescription>
            </SideDialogHeader>
            <div className='space-y-4'>
              <InputField register={form.register('name')} label='Name' description='This is a description' />
            </div>
            <SideDialogFooter>
              <SideDialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </SideDialogClose>
              <SubmitButton className='w-fit'>Submit</SubmitButton>
            </SideDialogFooter>
          </form>
        </Form>
      </SideDialogContent>
    </SideDialog>
  );
}
