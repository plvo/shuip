import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NavGroupProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function NavGroup({ title, children, icon }: NavGroupProps) {
  return (
    <div className='mb-6'>
      <h3 className='font-semibold mb-3 flex items-center gap-1.5'>
        <span className='size-4'>{icon}</span>
        {title}
      </h3>
      <ul>{children}</ul>
    </div>
  );
}

export function SubNavGroup({ title, children, icon }: NavGroupProps) {
  return (
    <div className='mb-4'>
      <h4 className='uppercase font-mono text-sm mb-2.5 flex items-center gap-1.5 text-muted-foreground'>
        <span className='size-4'>{icon}</span>
        {title}
      </h4>
      <ul>{children}</ul>
    </div>
  );
}

export function NavItem({
  title,
  href,
  isActive,
  ...props
}: { title: string; href: string; isActive: boolean } & React.LiHTMLAttributes<HTMLLIElement>) {
  return (
    <li
      {...props}
      className={cn(
        'list-none border-l-2 ml-1.5',
        'pl-3.5 py-1.5 data-[first-index="true"]:pt-0 data-[last-index=true]:pb-0',
        isActive ? 'border-primary/60' : 'border-muted',
      )}
    >
      <Link href={href}>
        <h5 className={cn('text-sm font-semibold', isActive ? 'text-primary' : 'text-foreground')}>{title}</h5>
      </Link>
    </li>
  );
}
