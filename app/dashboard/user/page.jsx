'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBalance } from 'wagmi';
import { toast } from '@/components/ui/use-toast';
import { Link } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: balance } = useBalance({
    address: session?.user?.walletAddress,
  });
  const [stats, setStats] = useState({ activeSubscriptions: 0, totalSpent: 0 });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'user') {
      router.push('/auth/signin');
    } else if (!session.user.walletAddress) {
      // Keep popup open
    } else {
      fetchStats();
    }
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      const subsResponse = await fetch('/api/user/subscriptions', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const transactionsResponse = await fetch('/api/user/transactions', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const subscriptions = await subsResponse.json();
      const transactions = await transactionsResponse.json();
      setStats({
        activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
        totalSpent: transactions.reduce((sum, tx) => sum + tx.amount, 0),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard stats.',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePayLink = async () => {
    if (!session.user.walletAddress) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = `pay/${nanoid(10)}`;
      const response = await fetch('/api/user/pay-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          name: `PayLink-${Date.now()}`,
          amount: 0.01,
          currency: 'ETH',
          type: 'one-time',
          redirectUrl: '',
        }),
      });
      const payLink = await response.json();
      navigator.clipboard.writeText(`${window.location.origin}/${payLink.url}`);
      toast({
        title: 'Pay Link Created',
        description: 'Pay link copied to clipboard.',
      });
    } catch (error) {
      console.error('Error creating pay link:', error);
      toast({
        title: 'Error',
        description: 'Failed to create pay link.',
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
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold">User Dashboard</h1>
          <Button onClick={handleCreatePayLink} className="bg-emerald-500 hover:bg-emerald-600">
            <Link className="w-4 h-4 mr-2" /> Create Pay Link
          </Button>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
            <CardHeader className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-white">Wallet Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {balance ? `${balance.formatted} ${balance.symbol}` : 'Loading...'}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
            <CardHeader className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-white">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{stats.activeSubscriptions}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
            <CardHeader className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-white">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">${stats.totalSpent.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}