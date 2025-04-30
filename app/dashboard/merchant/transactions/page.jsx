'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { BarChart2 } from 'lucide-react';
import { subscribeToWebSocket } from '@/lib/websocket';

export default function Transactions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else if (!session.user.walletAddress) {
      // Keep popup open
    } else {
      fetchTransactions();
    }
  }, [session, status, router]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/merchant/transactions', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transactions.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.type === 'transaction' && data.userId === session.user.id) {
        setTransactions((prev) => [...prev, data.transaction]);
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
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Transactions</h1>
          <Button
            onClick={() => router.push('/dashboard/merchant/analytics')}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <BarChart2 className="w-4 h-4 mr-2" /> View Analytics
          </Button>
        </header>
        <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-300">Transaction ID</TableHead>
                    <TableHead className="text-sm text-gray-300">Customer</TableHead>
                    <TableHead className="text-sm text-gray-300">Amount</TableHead>
                    <TableHead className="text-sm text-gray-300">Currency</TableHead>
                    <TableHead className="text-sm text-gray-300">Status</TableHead>
                    <TableHead className="text-sm text-gray-300">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-400 py-6">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-gray-800">
                        <TableCell className="font-medium text-sm text-white">
                          {tx.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">{tx.customer?.name || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-gray-400">{tx.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-gray-400">{tx.currency}</TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tx.status === 'completed'
                                ? 'bg-green-100 text-emerald-600'
                                : 'bg-yellow-100 text-yellow-600'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
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