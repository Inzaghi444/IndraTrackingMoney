'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: 'rounded-xl border border-border shadow-lg !max-w-[calc(100vw-2rem)]',
          },
        }}
        mobileOffset={{ top: 16, left: 12, right: 12 }}
        richColors
        closeButton
      />
    </NextThemesProvider>
  );
}
