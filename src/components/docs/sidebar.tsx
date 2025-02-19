import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { cn, stringToUppercase } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function DocSidebar({ compGroups }: { compGroups: Array<string> }) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {compGroups.map((group, i) => {
                const pathPage = `/docs/${group}`;
                const isPathActive = pathname === pathPage;

                return (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuButton asChild>
                      <Link href={pathPage} className={cn(isPathActive ? 'bg-muted font-bold' : 'text-gray-600')}>
                        <span>{stringToUppercase(group)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
