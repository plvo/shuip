import { Form } from '@/components/ui/form';
import ButtonSubmit from '@/components/ui/shuip/button.submit';
import InputField from '@/components/ui/shuip/input.form-field';
import { useZodForm } from 'shext';
import { z } from 'zod';

const zodSchema = z.object({
  name: z.string().nonempty({ message: 'Name is required' }),
});

export default function InputFieldExample() {
  // TODO: Explain
  const { form, control, handleSubmit } = useZodForm(zodSchema);

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(`Hello ${values.name}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <InputField control={control} name='name' label='Name' description='Your name' placeholder='John' />
        <ButtonSubmit label='Check' />
      </form>
    </Form>
  );
}
