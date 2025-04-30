'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, bscTestnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import AuthProvider from '@/components/AuthProvider';

// Initialize QueryClient
const queryClient = new QueryClient();

const inter = Inter({ subsets: ['latin'] });

const config = getDefaultConfig({
  appName: 'Your App Name',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains: [sepolia, bscTestnet],
  ssr: true,
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProvider config={config}>
          <SessionProvider>
            <AuthProvider>
              <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>{children}</RainbowKitProvider>
              </QueryClientProvider>
            </AuthProvider>
          </SessionProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}