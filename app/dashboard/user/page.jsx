'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { DollarSign } from 'lucide-react';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'user') {
      router.push('/auth/signin');
    } else {
      fetchSubscriptions();
      fetchTransactions();
    }
  }, [session, status, router]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/user/subscriptions', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
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

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/user/transactions', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data.slice(0, 5)); // Show recent 5 transactions
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transactions.',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        </header>
        <div className="space-y-6">
          <Card className="shadow-lg bg-white rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm text-gray-700">Plan Name</TableHead>
                      <TableHead className="text-sm text-gray-700">Amount</TableHead>
                      <TableHead className="text-sm text-gray-700">Currency</TableHead>
                      <TableHead className="text-sm text-gray-700">Next Billing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-6">
                          No active subscriptions.
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions
                        .filter((sub) => sub.status === 'active')
                        .map((sub) => (
                          <TableRow key={sub.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-sm text-gray-900">{sub.plan.name}</TableCell>
                            <TableCell className="text-sm text-gray-600">{sub.plan.amount}</TableCell>
                            <TableCell className="text-sm text-gray-600">{sub.plan.currency}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {sub.nextBilling ? new Date(sub.nextBilling).toLocaleDateString() : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-white rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm text-gray-700">Type</TableHead>
                      <TableHead className="text-sm text-gray-700">Amount</TableHead>
                      <TableHead className="text-sm text-gray-700">Currency</TableHead>
                      <TableHead className="text-sm text-gray-700">Network</TableHead>
                      <TableHead className="text-sm text-gray-700">Status</TableHead>
                      <TableHead className="text-sm text-gray-700">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-6">
                          No recent transactions.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-sm text-gray-900">{tx.type}</TableCell>
                          <TableCell className="text-sm text-gray-600">{tx.amount}</TableCell>
                          <TableCell className="text-sm text-gray-600">{tx.currency}</TableCell>
                          <TableCell className="text-sm text-gray-600">{tx.network}</TableCell>
                          <TableCell className="text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                tx.status === 'completed'
                                  ? 'bg-green-100 text-primary-user'
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
    </div>
  );
}