'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { subscribeToWebSocket } from '@/lib/websocket';

export default function Subscriptions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else if (!session.user.walletAddress) {
      // Keep popup open
    } else {
      fetchSubscriptions();
    }
  }, [session, status, router]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/merchant/subscriptions', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscriptions.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.type === 'subscription' && data.userId === session.user.id) {
        setSubscriptions((prev) => [...prev, data.subscription]);
      }
    });
    return () => ws.close();
  }, [session]);

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar role={session.user.role} />
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Subscriptions</h1>
        </header>
        <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-300">Plan</TableHead>
                    <TableHead className="text-sm text-gray-300">Customer</TableHead>
                    <TableHead className="text-sm text-gray-300">Amount</TableHead>
                    <TableHead className="text-sm text-gray-300">Currency</TableHead>
                    <TableHead className="text-sm text-gray-300">Status</TableHead>
                    <TableHead className="text-sm text-gray-300">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-400 py-6">
                        No subscriptions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-gray-800">
                        <TableCell className="font-medium text-sm text-white">{sub.plan.name}</TableCell>
                        <TableCell className="text-sm text-gray-400">{sub.customer?.name || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-gray-400">{sub.plan.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-gray-400">{sub.plan.currency}</TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sub.status === 'active'
                                ? 'bg-green-100 text-emerald-600'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}