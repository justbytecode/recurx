import { http, createConfig } from 'wagmi';
import { mainnet, polygon, bsc, sepolia, polygonMumbai, bscTestnet } from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, polygon, bsc, sepolia, polygonMumbai, bscTestnet],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [sepolia.id]: http(),
    [polygonMumbai.id]: http(),
    [bscTestnet.id]: http(),
  },
});