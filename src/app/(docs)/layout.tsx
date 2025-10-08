import { getPathsByCategory } from '@/actions/docs';
import { DocsSidebar, Header } from '@/components/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const pathsByCategory = await getPathsByCategory();

  return (
    <div className='flex flex-col max-w-[1451px] mx-auto border-x border-muted'>
      <Header pathsByCategory={pathsByCategory} />
      <div className='flex'>
        <DocsSidebar pathsByCategory={pathsByCategory} />
        <main className='min-h-[70vh] w-full py-8 max-lg:px-4 lg:px-6'>{children}</main>
      </div>
    </div>
  );
}
