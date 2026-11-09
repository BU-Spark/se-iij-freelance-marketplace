import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { DM_Serif_Display, Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from './components/Toast/ToastProvider';

const serif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'StoryMatch',
  description: 'The assignment desk that connects newsroom editors with independent journalists.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <ClerkProvider>
          <ToastProvider>{children}</ToastProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
