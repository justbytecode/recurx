'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, FileText, Link, BarChart2, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Toaster } from '@/components/ui/toaster';
import { subscribeToWebSocket } from '@/lib/websocket';
import { useBalance } from 'wagmi';
import { nanoid } from 'nanoid';
import { toast } from '@/components/ui/use-toast';

export default function MerchantDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeCustomers: 0,
    pendingInvoices: 0,
    activePayLinks: 0,
    activeSubscriptions: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  const { data: balance } = useBalance({
    address: session?.user?.walletAddress,
  });

  const fetchStats = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch('/api/merchant/stats', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);

      const txResponse = await fetch('/api/merchant/transactions', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!txResponse.ok) throw new Error('Failed to fetch transactions');
      const transactions = await txResponse.json();
      const chart = transactions.reduce((acc, tx) => {
        const date = new Date(tx.createdAt).toLocaleDateString();
        const existing = acc.find((item) => item.date === date);
        if (existing) {
          existing.amount += tx.amount;
        } else {
          acc.push({ date, amount: tx.amount });
        }
        return acc;
      }, []).slice(-30);
      setChartData(chart);
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
    if (!session || session.user.role !== 'merchant') {
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
            totalRevenue: prev.totalRevenue + data.transaction.amount,
          }));
          setChartData((prev) => {
            const date = new Date(data.transaction.createdAt).toLocaleDateString();
            const existing = prev.find((item) => item.date === date);
            if (existing) {
              existing.amount += data.transaction.amount;
              return [...prev];
            }
            return [...prev, { date, amount: data.transaction.amount }].slice(-30);
          });
        } else if (data.type === 'customer') {
          setStats((prev) => ({ ...prev, activeCustomers: prev.activeCustomers + 1 }));
        } else if (data.type === 'invoice' && data.invoice.status === 'pending') {
          setStats((prev) => ({ ...prev, pendingInvoices: prev.pendingInvoices + 1 }));
        } else if (data.type === 'payLink' && data.payLink.active) {
          setStats((prev) => ({ ...prev, activePayLinks: prev.activePayLinks + 1 }));
        } else if (data.type === 'subscription' && data.subscription.status === 'active') {
          setStats((prev) => ({ ...prev, activeSubscriptions: prev.activeSubscriptions + 1 }));
        }
      }
    });
    return () => ws.close();
  }, [session]);

  const handleCreatePayLink = async () => {
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
      const url = `pay/${nanoid(10)}`;
      const response = await fetch('/api/merchant/pay-links', {
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
      if (!response.ok) throw new Error('Failed to create pay link');
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

  // Callback to refresh data after wallet connection
  const handleWalletConnected = useCallback(() => {
    fetchStats();
    setShowWalletPrompt(false);
  }, [fetchStats]);

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar role={session.user.role} />
      {showWalletPrompt && <WalletConnectPopup role="merchant" onWalletConnected={handleWalletConnected} />}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
        {showWalletPrompt ? (
          <Card className="shadow-lg bg-gray-900 rounded-xl border-none max-w-2xl mx-auto mt-10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Wallet Required</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-400 text-center">
                Please connect your wallet to access the full merchant dashboard.
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
            <header className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl sm:text-3xl font-bold">Merchant Dashboard</h1>
              <Button onClick={handleCreatePayLink} className="bg-emerald-500 hover:bg-emerald-600">
                Create Pay Link
              </Button>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
                <CardHeader className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-sm font-semibold text-white">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
                <CardHeader className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-sm font-semibold text-white">Active Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">{stats.activeCustomers}</p>
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
                  <Link className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-sm font-semibold text-white">Active Pay Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">{stats.activePayLinks}</p>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-6 shadow-lg bg-gray-900 rounded-xl border-none">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Achievements Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center">No transaction data available.</p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', borderRadius: '8px', border: 'none' }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Bar dataKey="amount" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
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
          </>
        )}
      </div>
      <Toaster />
    </div>
  );
}