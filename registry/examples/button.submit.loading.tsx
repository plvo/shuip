import ButtonSubmit from '@/components/ui/shuip/button.submit';

export default function ButtonSubmitLoadingExample() {
  return <ButtonSubmit label='Submit' loading={true} onClick={() => alert('Button clicked')} />;
}
