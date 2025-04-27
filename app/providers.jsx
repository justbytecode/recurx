'use client';

import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

export function Providers({ children, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={pageProps?.dehydratedState}>
            <RainbowKitProvider modalSize="compact">
              {children}
              <Toaster />
            </RainbowKitProvider>
          </HydrationBoundary>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
}