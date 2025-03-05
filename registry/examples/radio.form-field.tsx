// @ts-nocheck
import RadioField from '@/components/ui/shuip/radio.form-field';
import { useForm } from 'react-hook-form';

export default function RadioFieldExample() {
  // TODO with shext
  const { control } = useForm();

  return (
    <RadioField
      control={control}
      name="radio"
      label="Radio"
      options={[
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' },
        { label: 'Option 3', value: '3' },
      ]}
    />
  );
}
