"use client"

import { ButtonSubmit } from "@/components/ui/shuip/button.submit";

export default function Home() {
  return (
    <main>
      <ButtonSubmit label={'Submit'} onClick={() => console.log('submit')} />
    </main>
  );
}
