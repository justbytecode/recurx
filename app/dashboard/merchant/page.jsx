
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, FileText, Link } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { subscribeToWebSocket } from '@/lib/websocket';
import { useBalance } from 'wagmi';

export default function MerchantDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeCustomers: 0,
    pendingInvoices: 0,
    activePayLinks: 0,
  });
  const { data: balance } = useBalance({
    address: session?.user?.walletAddress,
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  useEffect(() => {
    async function fetchStats() {
      if (!session) return;
      try {
        const response = await fetch('/api/merchant/stats', {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard stats.',
          variant: 'destructive',
        });
      }
    }
    fetchStats();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.userId === session.user.id) {
        if (data.type === 'transaction' && data.transaction.status === 'completed') {
          setStats((prev) => ({
            ...prev,
            totalRevenue: prev.totalRevenue + data.transaction.amount,
          }));
        } else if (data.type === 'customer') {
          setStats((prev) => ({ ...prev, activeCustomers: prev.activeCustomers + 1 }));
        } else if (data.type === 'invoice' && data.invoice.status === 'pending') {
          setStats((prev) => ({ ...prev, pendingInvoices: prev.pendingInvoices + 1 }));
        } else if (data.type === 'payLink' && data.payLink.active) {
          setStats((prev) => ({ ...prev, activePayLinks: prev.activePayLinks + 1 }));
        }
      }
    });
    return () => ws.close();
  }, [session]);

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Merchant Dashboard</h1>
          {session.user.walletAddress && (
            <p className="text-sm text-gray-600">
              Wallet Balance: {balance?.formatted} {balance?.symbol}
            </p>
          )}
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="shadow-lg bg-white rounded-xl">
            <CardHeader className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-merchant" />
              <CardTitle className="text-sm font-semibold text-gray-900">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-white rounded-xl">
            <CardHeader className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-merchant" />
              <CardTitle className="text-sm font-semibold text-gray-900">Active Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-white rounded-xl">
            <CardHeader className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-merchant" />
              <CardTitle className="text-sm font-semibold text-gray-900">Pending Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingInvoices}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-white rounded-xl">
            <CardHeader className="flex items-center gap-2">
              <Link className="w-5 h-5 text-primary-merchant" />
              <CardTitle className="text-sm font-semibold text-gray-900">Active Pay Links</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{stats.activePayLinks}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
