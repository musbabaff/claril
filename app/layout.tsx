import type { Metadata } from 'next';
import { Geist, Geist_Mono, Newsreader, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import TweaksWrapper from '@/components/tweaks-wrapper';
import { CookieConsent } from '@/components/shared/cookie-consent';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['300', '400', '500'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Claril — Universal Multi-Agent Document Intelligence Platform',
  description: 'Multi-agent coordination pipelines that ingest, extract, and cross-verify document workflows into audit-ready structured outputs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TweaksWrapper>
            {children}
          </TweaksWrapper>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'bg-bg-elevated text-text-primary border border-border-subtle rounded-md shadow-lg',
            }}
          />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
