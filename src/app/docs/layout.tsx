import { getComponentsGroups } from '@/lib/comp-groups';
import DocProvider from '@/lib/doc-provider';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const compGroups = getComponentsGroups();
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DocProvider compGroups={compGroups}>{children}</DocProvider>
      </body>
    </html>
  );
}
