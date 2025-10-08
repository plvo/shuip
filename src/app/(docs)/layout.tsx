import { getPathsByCategory } from '@/actions/docs';
import { DocsSidebar, Header } from '@/components/docs/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { pathsByCategory } = await getPathsByCategory();

  return (
    <div className='flex flex-col border-x max-w-[1451px] mx-auto'>
      <Header pathsByCategory={pathsByCategory} />
      <div className='flex'>
        <DocsSidebar pathsByCategory={pathsByCategory} />
        <main className='min-h-[70vh] w-full py-8 max-lg:px-4 lg:px-6'>{children}</main>
      </div>
    </div>
  );
}
