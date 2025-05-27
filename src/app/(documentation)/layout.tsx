import { DocsNav } from '@/components/documentation/docs-nav';
import { Header } from '@/components/documentation/header';

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-col border max-w-[1450px] mx-auto'>
      <Header />
      <div className='flex'>
        <div className='md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-6'>
          <aside className={'top-14 z-30 h-[calc(100vh-3.5rem)] w-full border-r fixed hidden md:sticky md:block'}>
            <div className='h-full overflow-auto no-scrollbar py-8 px-4'>
              <DocsNav />
            </div>
          </aside>
        </div>
        <main className='min-h-[70vh] w-full md:py-8 max-md:px-4'>{children}</main>
      </div>
    </div>
  );
}
