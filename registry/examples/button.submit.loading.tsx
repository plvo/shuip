import ButtonSubmit from '../ui/button.submit';

export default function ButtonSubmitLoadingExample() {
  return (
    <ButtonSubmit
      onClick={() => alert('Button clicked')}
      label="Submit"
      loading={true}
      // disabled
    />
  );
}
