'use client';

import { WagmiProvider, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { createPublicClient, http } from 'viem';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query';
import AuthProvider from '@/components/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import '@/app/globals.css';

// Create a QueryClient instance
const queryClient = new QueryClient();

// Configure Wagmi with explicit autoConnect: false
const config = createConfig({
  autoConnect: false,
  publicClient: () => {
    return createPublicClient({
      chain: sepolia,
      transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    });
  },
  chains: [sepolia],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary>
              <RainbowKitProvider chains={[sepolia]} initialChain={sepolia}>
                <AuthProvider>
                  <Toaster />
                  {children}
                </AuthProvider>
              </RainbowKitProvider>
            </HydrationBoundary>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}