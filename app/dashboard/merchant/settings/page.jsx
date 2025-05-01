'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { toast } from '@/components/ui/use-toast';
import { Copy, LogOut, Wallet, Network } from 'lucide-react';
import { useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { sepolia, bscTestnet } from 'wagmi/chains';

export default function MerchantSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { address, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address: session?.user?.walletAddress });
  const [isWalletConnected, setIsWalletConnected] = useState(!!session?.user?.walletAddress);

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
      setIsWalletConnected(false);
      toast({
        title: 'Success',
        description: 'Wallet disconnected successfully.',
        className: 'bg-green-500 text-white',
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
        className: 'bg-green-500 text-white',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/');
      toast({
        title: 'Success',
        description: 'Signed out successfully.',
        className: 'bg-green-500 text-white',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out.',
        variant: 'destructive',
      });
    }
  };

  const handleNetworkSwitch = async (chainId) => {
    try {
      await switchChain({ chainId });
      toast({
        title: 'Success',
        description: `Switched to ${chainId === sepolia.id ? 'Sepolia' : 'BSC Testnet'}.`,
        className: 'bg-green-500 text-white',
      });
    } catch (error) {
      console.error('Error switching network:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch network.',
        variant: 'destructive',
      });
    }
  };

  const handleWalletConnected = () => {
    setIsWalletConnected(true);
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-zinc-900">
      <Sidebar role={session.user.role} />
      {!isWalletConnected && <WalletConnectPopup role="merchant" onWalletConnected={handleWalletConnected} />}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-zinc-100">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
            Settings
          </h1>
        </header>
        <Card className="shadow-lg bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl border border-zinc-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-zinc-100">Wallet Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {session.user.walletAddress ? (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-zinc-300">Wallet Address</label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm text-zinc-400 break-all">{session.user.walletAddress}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="text-zinc-400 hover:text-indigo-400"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">Balance</label>
                  <p className="mt-1 text-sm text-zinc-400">
                    {balance ? `${balance.formatted} ${balance.symbol}` : 'Loading...'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">Network</label>
                  <div className="mt-1 flex gap-2">
                    <Button
                      onClick={() => handleNetworkSwitch(sepolia.id)}
                      className={`text-xs ${chainId === sepolia.id ? 'bg-indigo-500' : 'bg-zinc-800'} hover:bg-indigo-600`}
                    >
                      Sepolia
                    </Button>
                    <Button
                      onClick={() => handleNetworkSwitch(bscTestnet.id)}
                      className={`text-xs ${chainId === bscTestnet.id ? 'bg-indigo-500' : 'bg-zinc-800'} hover:bg-indigo-600`}
                    >
                      BSC Testnet
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4">
                  <ConnectButton
                    showBalance={false}
                    accountStatus="address"
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg"
                  />
                  <Button
                    onClick={handleDisconnect}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect Wallet
                  </Button>
                </div>
                <Button
                  onClick={() => router.push('/dashboard/merchant/transactions')}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold py-2 px-4 rounded-lg"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  View Transaction History
                </Button>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No wallet connected. Please connect a wallet to proceed.</p>
            )}
          </CardContent>
        </Card>
        <Card className="mt-6 shadow-lg bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl border border-zinc-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-zinc-100">Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}