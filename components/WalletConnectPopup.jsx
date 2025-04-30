'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Wallet, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function WalletConnectPopup({ role, onWalletConnected }) {
  const { data: session, status } = useSession();
  const { address, isConnecting, isConnected } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [connectLater, setConnectLater] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    // Open popup if no wallet is connected and user hasn't dismissed
    if (!session?.user?.walletAddress && !isConnected && !connectLater) {
      setIsOpen(true);
    } else if (isConnected && address && session && !session.user.walletAddress) {
      // Update wallet address in backend
      const endpoint = role === 'merchant' ? '/api/merchant/wallet' : '/api/user/wallet';
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ address }),
      })
        .then((response) => {
          if (!response.ok) throw new Error('Failed to connect wallet');
          setIsOpen(false);
          toast({
            title: 'Success',
            description: 'Wallet connected successfully.',
            className: 'bg-green-500 text-white',
          });
          // Notify parent component of successful connection
          if (onWalletConnected) onWalletConnected();
        })
        .catch((error) => {
          console.error('Error connecting wallet:', error);
          toast({
            title: 'Error',
            description: 'Failed to connect wallet. Please try again.',
            variant: 'destructive',
          });
        });
    } else if (session?.user?.walletAddress) {
      setIsOpen(false);
    }
  }, [session, status, address, isConnected, role, connectLater, onWalletConnected]);

  const handleConnectLater = () => {
    setConnectLater(true);
    setIsOpen(false);
    toast({
      title: 'Info',
      description: 'You can connect your wallet later from the dashboard.',
      className: 'bg-blue-500 text-white',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleConnectLater()}>
      <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl max-w-md border-none shadow-2xl p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative p-8"
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
            onClick={handleConnectLater}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Header */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="relative w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-emerald-400" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
              Connect Your Wallet
            </h2>
            <p className="text-sm text-gray-300 text-center max-w-xs">
              Connect a wallet to access the {role} dashboard and start managing your payments.
            </p>
          </div>

          {/* Wallet Connection */}
          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, mounted }) => {
              if (!mounted) {
                return (
                  <Button
                    disabled
                    className="w-full bg-gray-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center"
                  >
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </Button>
                );
              }

              return (
                <Button
                  onClick={openConnectModal}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Wallet'
                  )}
                </Button>
              );
            }}
          </ConnectButton.Custom>

          {/* Supported Wallets */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 mb-2">Supported Wallets</p>
            <div className="flex justify-center gap-4">
              <Image src="/metamask.png" alt="MetaMask" width={24} height={24} className="opacity-70 hover:opacity-100 transition-opacity" />
              <Image src="/walletconnect.png" alt="WalletConnect" width={24} height={24} className="opacity-70 hover:opacity-100 transition-opacity" />
              <Image src="/coinbase.png" alt="Coinbase Wallet" width={24} height={24} className="opacity-70 hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Connect Later Option */}
          <Button
            variant="link"
            className="mt-4 text-gray-400 hover:text-white text-sm w-full"
            onClick={handleConnectLater}
          >
            Connect Later
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}