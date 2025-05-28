import { SignoutDialog } from '@/components/ui/shuip/signout-dialog';

export default function SignoutDialogExample() {
  return <SignoutDialog withLogo onConfirm={() => alert('Signout!')} />;
}
