'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';

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

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Subscriptions</h1>
      </header>
      <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Your Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>{sub.plan?.name || '-'}</TableCell>
                    <TableCell>{sub.customer?.name || '-'}</TableCell>
                    <TableCell>{sub.status}</TableCell>
                    <TableCell>{sub.nextBilling ? new Date(sub.nextBilling).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{new Date(sub.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}