import RootProvider from '@/lib/root-provider';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}>
        <RootProvider attribute={'class'}>{children}</RootProvider>
      </body>
    </html>
  );
}
