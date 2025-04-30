'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { useAccount, useDisconnect } from 'wagmi';

export default function UserSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [profile, setProfile] = useState({ name: '', email: '' });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'user') {
      router.push('/auth/signin');
    } else {
      setProfile({ name: session.user.name, email: session.user.email });
    }
  }, [session, status, router]);

  const handleUpdateProfile = async () => {
    try {
      // Placeholder for profile update API
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await fetch('/api/user/wallet/disconnect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
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

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar role={session.user.role} />
      {!session.user.walletAddress && <WalletConnectPopup role="user" />}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        </header>
        <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-300">Name</label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Email</label>
              <Input
                value={profile.email}
                disabled
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Button onClick={handleUpdateProfile} className="bg-emerald-500 hover:bg-emerald-600">
              Save Changes
            </Button>
          </CardContent>
        </Card>
        <Card className="mt-6 shadow-lg bg-gray-900 rounded-xl border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            {session.user.walletAddress ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Connected Wallet: {session.user.walletAddress.slice(0, 6)}...{session.user.walletAddress.slice(-4)}
                </p>
                <Button
                  variant="outline"
                  onClick={handleDisconnectWallet}
                  className="border-gray-700 hover:bg-red-700 text-red-400"
                >
                  Disconnect Wallet
                </Button>
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