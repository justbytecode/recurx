/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
          // Provide fallbacks for Node.js built-in modules in client-side code
          config.resolve.fallback = {
            ...config.resolve.fallback,
            async_hooks: false,
            fs: false,
            net: false,
            tls: false,
          };
        }
        return config;
      },
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
        NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
        PAYMENT_PROCESSOR_ADDRESS: process.env.PAYMENT_PROCESSOR_ADDRESS,
        PLATFORM_WALLET_ADDRESS: process.env.PLATFORM_WALLET_ADDRESS,
        PRIVATE_KEY: process.env.PRIVATE_KEY,
        INFURA_API_KEY: process.env.INFURA_API_KEY,
        ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
        POLYGONSCAN_API_KEY: process.env.POLYGONSCAN_API_KEY,
        BSCSCAN_API_KEY: process.env.BSCSCAN_API_KEY,
        EMAIL_SERVICE_API_KEY: process.env.EMAIL_SERVICE_API_KEY,
      },
};

export default nextConfig;
