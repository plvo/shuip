import { useZodForm } from 'shext';
import { z } from 'zod';
import { SelectField } from '@/components/ui/shuip/select.form-field';
import { Form } from '@/components/ui/form';
import ButtonSubmit from '@/components/ui/shuip/button.submit';

const zodSchema = z.object({
  selection: z.enum(['1', '2', '3']),
});

export default function SelectFieldExample() {
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <SelectField
          control={control}
          placeholder="Select an option"
          name="selection"
          label="selection"
          values={[
            { label: 'First', value: '1' },
            { label: 'Second', value: '2' },
            { label: 'Third', value: '3' },
          ]}
        />
        <ButtonSubmit label="Check" />
      </form>
    </Form>
  );
}
