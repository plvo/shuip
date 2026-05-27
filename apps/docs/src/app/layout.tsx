import { Analytics } from '@vercel/analytics/next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { AppProvider } from '@/components/app-provider';
import '@/styles/globals.css';

const plexSans = IBM_Plex_Sans({
  variable: '--font-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | shuip',
    default: 'shuip',
  },
  description:
    'Ship fast with shuip components, a collection of UI components for your next.js project, built with shadcn/ui.',
  keywords: ['javascript', 'components', 'next.js', 'tailwindcss', 'react', 'web', 'ui', 'design'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={`${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body className='antialiased overflow-x-hidden' suppressHydrationWarning>
        <RootProvider>
          <AppProvider>{children}</AppProvider>
        </RootProvider>
        <Analytics />
      </body>
    </html>
  );
}
