import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import RootProvider from '@/providers/root-provider';
import '@/styles/globals.css';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['200', '400', '600', '900'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | sh(ui)p 🚀',
    default: 'sh(ui)p 🚀',
  },
  description:
    'Ship fast with sh(ui)p components, a collection of UI components for your next.js project, built with shadcn/ui.',
  keywords: ['javascript', 'components', 'next.js', 'tailwindcss', 'react', 'web', 'ui', 'design'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased overflow-x-hidden`} suppressHydrationWarning>
        <RootProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors />
        </RootProvider>
        <Analytics />
      </body>
    </html>
  );
}
