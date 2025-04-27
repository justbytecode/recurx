'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccount, useBalance } from 'wagmi';
import { toast } from '@/components/ui/use-toast';
import { Wallet, Copy } from 'lucide-react';
import { truncateAddress } from '@/lib/utils';

export default function UserWallet() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [walletAddress, setWalletAddress] = useState(session?.user?.walletAddress || '');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'user') {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (isConnected && address && address !== walletAddress) {
      updateWalletAddress(address);
    }
  }, [address, isConnected, walletAddress]);

  const updateWalletAddress = async (newAddress) => {
    try {
      const response = await fetch('/api/user/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ address: newAddress }),
      });
      if (!response.ok) {
        throw new Error('Failed to update wallet address');
      }
      setWalletAddress(newAddress);
      toast({
        title: 'Wallet Updated',
        description: 'Your wallet address has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating wallet address:', error);
      toast({
        title: 'Error',
        description: 'Failed to update wallet address.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: 'Copied',
        description: 'Wallet address copied to clipboard.',
      });
    }
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Wallet</h1>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected && walletAddress ? (
              <>
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary-user" />
                  <p className="text-sm font-medium text-gray-900">Address: {truncateAddress(walletAddress)}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="flex items-center gap-1 border-gray-300 hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Balance: {balance?.formatted} {balance?.symbol}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Connect your wallet to view balance and manage funds.
              </p>
            )}
            {!isConnected && (
              <Button className="bg-primary-user hover:bg-blue-600">
                Connect Wallet
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}