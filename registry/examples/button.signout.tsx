import ButtonSignout from '@/components/ui/shuip/button.signout';

export default function ButtonSignoutExample() {
  return <ButtonSignout withLogo onConfirm={() => alert('Signout!')} />;
}
