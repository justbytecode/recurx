'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi';
import toast from 'react-hot-toast';
import { Wallet as WalletIcon, Copy, X } from 'lucide-react';

const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function Wallet() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({ address });
  const { connectors, connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const [walletAddress, setWalletAddress] = useState(session?.user?.walletAddress || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (isConnected && address && address !== walletAddress) {
      updateWalletAddress(address);
    }
  }, [address, isConnected, walletAddress]);

  const updateWalletAddress = async (newAddress) => {
    if (!newAddress) {
      toast.error('No wallet address provided.');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/merchant/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ address: newAddress }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to update wallet address');
      }

      const wallet = await response.json();
      setWalletAddress(wallet.address);
      toast.success(`Wallet address updated to ${truncateAddress(wallet.address)} (Network: ${wallet.network}).`);
    } catch (error) {
      console.error('Error updating wallet address:', error);
      toast.error(error.message || 'Failed to update wallet address.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success('Wallet address copied to clipboard.');
    } else {
      toast.error('No wallet address to copy.');
    }
  };

  const handleConnect = async (connector) => {
    try {
      await connectAsync({ connector });
      setIsModalOpen(false);
      toast.success('Wallet connected successfully.');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/merchant/wallet/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      disconnect();
      setWalletAddress('');
      setIsModalOpen(false);
      toast.success('Wallet disconnected successfully. All API keys have been revoked.');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet.');
    }
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Wallet</h1>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-merchant hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
          >
            {isConnected ? 'Manage Wallet' : 'Connect Wallet'}
          </Button>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isConnected && walletAddress ? (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <WalletIcon className="w-6 h-6 text-primary-merchant" />
                  <p className="text-sm font-medium text-gray-900">
                    Address: {truncateAddress(walletAddress)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAddress}
                    disabled={isUpdating}
                    className="flex items-center gap-2 border-gray-300 hover:bg-gray-100 transition-all duration-200 disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Balance:{' '}
                  {balanceLoading ? (
                    'Loading...'
                  ) : (
                    `${balance?.formatted || '0'} ${balance?.symbol || ''}`
                  )}
                </p>
                <p className="text-sm text-gray-600">Network: Sepolia</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Connect your wallet to view balance and manage funds. All payments will be received here.
              </p>
            )}
            {isUpdating && (
              <p className="text-sm text-gray-500">Updating wallet address...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom Wallet Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative transform transition-all duration-300 animate-scale-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {isConnected ? 'Manage Wallet' : 'Connect a Wallet'}
            </h2>
            <div className="space-y-4">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  disabled={isConnected && connector.id === address?.connector?.id}
                  className={`flex items-center gap-3 p-3 w-full rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isConnected && connector.id === address?.connector?.id
                      ? 'bg-primary-merchant text-white border-primary-merchant'
                      : ''
                  }`}
                >
                  <WalletIcon className="w-6 h-6 text-gray-600" />
                  <span className="text-sm font-medium">{connector.name}</span>
                  {isConnected && connector.id === address?.connector?.id && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-green-500" />
                  )}
                </button>
              ))}
              {isConnected && (
                <Button
                  onClick={handleDisconnect}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition-all duration-200"
                >
                  Disconnect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}