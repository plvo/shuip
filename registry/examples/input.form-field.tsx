import { useForm } from 'react-hook-form';
import InputField from '@/components/ui/shuip/input.form-field';

export default function InputFieldExample() {
  // TODO with shext
  const { control } = useForm();

  return <InputField control={control} name="name" label="Name" description="Your name" placeholder="John" />;
}
