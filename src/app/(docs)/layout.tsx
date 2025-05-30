import { DocsNav } from '@/components/docs/docs-nav';
import { Header } from '@/components/docs/header';

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-col border-x max-w-[1451px] mx-auto'>
      <Header />
      <div className='flex'>
        <div className='md:grid md:grid-cols-[220px_minmax(0,1fr)]'>
          <aside className={'top-14 z-30 h-[calc(100vh-3.5rem)] w-full border-r fixed hidden md:sticky md:block'}>
            <div className='h-full overflow-auto no-scrollbar py-8 px-4'>
              <DocsNav />
            </div>
          </aside>
        </div>
        <main className='min-h-[70vh] w-full py-8 max-lg:px-4 lg:px-6'>{children}</main>
      </div>
    </div>
  );
}
