import { Form } from '@/components/ui/form';
import ButtonSubmit from '@/components/ui/shuip/button.submit';
import RadioField from '@/components/ui/shuip/radio.form-field';
import { useZodForm } from 'shext';
import { z } from 'zod';

const zodSchema = z.object({
  selection: z.enum(['1', '2', '3']),
});

export default function RadioFieldExample() {
  const { form, control, handleSubmit } = useZodForm(zodSchema);

  async function onSubmit(values: z.infer<typeof zodSchema>) {
    try {
      alert(`Selection: ${values.selection}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <RadioField control={control} name='selection' label='selection' values={['1', '2', '3']} />
        <ButtonSubmit label='Check' />
      </form>
    </Form>
  );
}
