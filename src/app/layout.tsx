import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Header } from '@/components/navigation/header';
import { Sidebar } from '@/components/navigation/sidebar';

export const metadata: Metadata = {
  title: 'Ultrix Talent Hub',
  description: 'Single record per person from first interview to monthly client review.',
};

import { Suspense } from 'react';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background text-foreground flex flex-col font-sans antialiased selection:bg-cyan-500/30 selection:text-white">
        <AuthProvider>
          <Suspense fallback={null}>
            <Header />
          </Suspense>
          <div className="flex-1 flex overflow-hidden">
            <Suspense fallback={null}>
              <Sidebar />
            </Suspense>
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto space-y-6">{children}</div>
            </main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'bg-[#181d28] border border-white/10 text-slate-100 shadow-2xl',
              duration: 4000,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
