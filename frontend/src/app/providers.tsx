'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CookieConsentProvider } from '@/components/cookie-consent';
import { ErrorBoundary } from '@/components/error-boundary';
import { PwaProvider } from '@/components/pwa/pwa-provider';
import { SiteShell } from '@/components/site-shell';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

/** Same provider order the Vite entry used: app boundary, query client, tooltips, routed boundary, shell. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary resetKey={pathname}>
            <CookieConsentProvider>
              <PwaProvider>
                <SiteShell>{children}</SiteShell>
              </PwaProvider>
            </CookieConsentProvider>
          </ErrorBoundary>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
