import DocProvider from '@/lib/doc-provider';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DocProvider>{children}</DocProvider>
      </body>
    </html>
  );
}
