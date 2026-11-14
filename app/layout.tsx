import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/context';
import { AuthProvider } from '@/lib/auth/context';
import { AppShell } from '@/components/shell/AppShell';

export const metadata: Metadata = {
  title: 'Motherboard — Tech-Moms Ecosystem',
  description: 'An all-in-one ecosystem for Tech-Moms students, alumni, staff, employers and supporters.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-background text-foreground">
        <I18nProvider>
          <AuthProvider>
            <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading Motherboard...</div>}>
              <AppShell>{children}</AppShell>
            </Suspense>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

