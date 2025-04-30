'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccount, useDisconnect } from 'wagmi';
import { toast } from '@/components/ui/use-toast';
import { Copy, LogOut } from 'lucide-react';
import { useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function MerchantWallet() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address: session?.user?.walletAddress });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/merchant/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ disconnect: true }),
      });
      if (!response.ok) throw new Error('Failed to disconnect wallet');
      disconnect();
      toast({
        title: 'Success',
        description: 'Wallet disconnected successfully.',
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect wallet.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyAddress = () => {
    if (session.user.walletAddress) {
      navigator.clipboard.writeText(session.user.walletAddress);
      toast({
        title: 'Copied',
        description: 'Wallet address copied to clipboard.',
      });
    }
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar role={session.user.role} />
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Wallet</h1>
        </header>
        <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Wallet Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {session.user.walletAddress ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Wallet Address</label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm text-gray-400 break-all">{session.user.walletAddress}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Balance</label>
                  <p className="mt-1 text-sm text-gray-400">
                    {balance ? `${balance.formatted} ${balance.symbol}` : 'Loading...'}
                  </p>
                </div>
                <div className="flex gap-4">
                  <ConnectButton
                    showBalance={false}
                    accountStatus="address"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg"
                  />
                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect Wallet
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No wallet connected. Please connect a wallet to proceed.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}