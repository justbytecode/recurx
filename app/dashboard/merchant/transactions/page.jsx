'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { subscribeToWebSocket } from '@/lib/websocket';

export default function Transactions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else {
      fetchTransactions();
      setIsLoading(false);
    }
  }, [session, status, router]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/merchant/transactions', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.log('API response status:', response.status);
        console.log('API response body:', errorData);
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error(error.message || 'Failed to load transactions.', {
        style: {
          borderRadius: '8px',
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
        },
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

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (status === 'loading' || isLoading || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 border-gray-300 focus:ring-primary-merchant"
            />
          </div>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-700">Type</TableHead>
                    <TableHead className="text-sm text-gray-700">Customer</TableHead>
                    <TableHead className="text-sm text-gray-700">Amount</TableHead>
                    <TableHead className="text-sm text-gray-700">Currency</TableHead>
                    <TableHead className="text-sm text-gray-700">Network</TableHead>
                    <TableHead className="text-sm text-gray-700">Status</TableHead>
                    <TableHead className="text-sm text-gray-700">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-6">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{tx.type}</TableCell>
                        <TableCell className="text-sm text-gray-600">{tx.customer?.name || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{tx.amount}</TableCell>
                        <TableCell className="text-sm text-gray-600">{tx.currency}</TableCell>
                        <TableCell className="text-sm text-gray-600">{tx.network}</TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tx.status === 'completed'
                                ? 'bg-green-100 text-primary-merchant'
                                : 'bg-yellow-100 text-yellow-600'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
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