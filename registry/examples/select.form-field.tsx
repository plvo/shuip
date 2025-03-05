import { SelectField } from '@/components/ui/shuip/select.form-field';
import { useForm } from 'react-hook-form';

export default function SelectFieldExample() {
  // TODO with shext
  const { control } = useForm();

  return (
    <SelectField
      control={control}
      name="radio"
      label="Radio"
      placeholder="Select an option"
      values={[
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' },
        { label: 'Option 3', value: '3' },
      ]}
    />
  );
}
