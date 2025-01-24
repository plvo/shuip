"use client"
import { ButtonSubmit } from '@r/c/button.submit';

export default function Home() {
  return (
    <main>
      <ButtonSubmit label={'Submit'} onClick={() => console.log('submit')} />
    </main>
  );
}
