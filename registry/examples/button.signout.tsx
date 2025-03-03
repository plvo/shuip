'use client';

import ButtonSignout from '../ui/button.signout';

export default function ButtonSignoutExample() {
  return <ButtonSignout withLogo onConfirm={() => alert('Signout!')} />;
}
