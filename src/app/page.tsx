import CodeAllCli from '@/components/mdx/code.all-cli';

export default function Home() {
  return (
    <main className='flex flex-col items-center justify-center h-screen gap-8'>
      <h1 className='text-4xl hover:text-amber-400'>
        <b>
          sh<span className='text-amber-400 hover:text-foreground'>ui</span>p
        </b>{' '}
      </h1>
      <p className='text-muted-foreground'>
        🚀 Ship fast with sh(ui)p components, a collection of UI components for your next.js project, built with
        shadcn/ui
      </p>

      <div className='w-full max-w-3xl'>
        <CodeAllCli />
      </div>

      <div className='flex flex-col gap-2 justify-center items-center'>
        <a href='https://github.com/plvo/shuip' className='hover:underline underline-offset-4'>
          github.com/plvo/shuip
        </a>
        <a href='/docs' className='hover:underline underline-offset-4'>
          /docs
        </a>
      </div>

      <img src='/logo.png' alt='shuip' />
    </main>
  );
}
