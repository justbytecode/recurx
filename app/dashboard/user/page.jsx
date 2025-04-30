'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, FileText, Repeat, Wallet } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { subscribeToWebSocket } from '@/lib/websocket';
import { useBalance } from 'wagmi';
import { toast } from '@/components/ui/use-toast';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSpent: 0,
    pendingInvoices: 0,
    activeSubscriptions: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  const { data: balance } = useBalance({
    address: session?.user?.walletAddress,
  });

  const fetchStats = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch('/api/user/stats', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);

      const txResponse = await fetch('/api/user/transactions', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!txResponse.ok) throw new Error('Failed to fetch transactions');
      const txData = await txResponse.json();
      setTransactions(txData.slice(0, 10));
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard stats.',
        variant: 'destructive',
      });
    }
  }, [session]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'user') {
      router.push('/auth/signin');
    } else if (!session.user.walletAddress) {
      setShowWalletPrompt(true);
    } else {
      fetchStats();
      setShowWalletPrompt(false);
    }
  }, [session, status, router, fetchStats]);

  useEffect(() => {
    if (!session || !session.user.walletAddress) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.userId === session.user.id) {
        if (data.type === 'transaction' && data.transaction.status === 'completed') {
          setStats((prev) => ({
            ...prev,
            totalSpent: prev.totalSpent + data.transaction.amount,
          }));
          setTransactions((prev) => [
            { id: data.transaction.id, amount: data.transaction.amount, createdAt: data.transaction.createdAt, status: 'completed' },
            ...prev.slice(0, 9),
          ]);
        } else if (data.type === 'invoice' && data.invoice.status === 'pending') {
          setStats((prev) => ({ ...prev, pendingInvoices: prev.pendingInvoices + 1 }));
        } else if (data.type === 'subscription' && data.subscription.status === 'active') {
          setStats((prev) => ({ ...prev, activeSubscriptions: prev.activeSubscriptions + 1 }));
        }
      }
    });
    return () => ws.close();
  }, [session]);

  const handlePayInvoice = async (invoiceId) => {
    if (!session.user.walletAddress) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      setShowWalletPrompt(true);
      return;
    }

    try {
      const response = await fetch(`/api/user/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to pay invoice');
      toast({
        title: 'Success',
        description: 'Invoice paid successfully.',
      });
      fetchStats();
    } catch (error) {
      console.error('Error paying invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to pay invoice.',
        variant: 'destructive',
      });
    }
  };

  // Callback to refresh data after wallet connection
  const handleWalletConnected = useCallback(() => {
    fetchStats();
    setShowWalletPrompt(false);
  }, [fetchStats]);

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar role={session.user.role} />
      {showWalletPrompt && <WalletConnectPopup role="user" onWalletConnected={handleWalletConnected} />}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
        {showWalletPrompt ? (
          <Card className="shadow-lg bg-gray-900 rounded-xl border-none max-w-2xl mx-auto mt-10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Wallet Required</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-400 text-center">
                Please connect your wallet to access the full user dashboard.
              </p>
              <Button
                onClick={() => setShowWalletPrompt(true)}
                className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <header className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold">User Dashboard</h1>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
                <CardHeader className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-sm font-semibold text-white">Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">${stats.totalSpent.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
                <CardHeader className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-sm font-semibold text-white">Pending Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">{stats.pendingInvoices}</p>
                </CardContent>
              </Card>
              <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
                <CardHeader className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-sm font-semibold text-white">Active Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">{stats.activeSubscriptions}</p>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-6 shadow-lg bg-gray-900 rounded-xl border-none">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Wallet Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">
                  {balance ? `${balance.formatted} ${balance.symbol}` : 'Loading...'}
                </p>
              </CardContent>
            </Card>
            <Card className="mt-6 shadow-lg bg-gray-900 rounded-xl border-none">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center">No transactions available.</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400">Amount: ${tx.amount.toFixed(2)}</p>
                        </div>
                        <p className="text-sm capitalize text-emerald-500">{tx.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <Toaster />
    </div>
  );
}