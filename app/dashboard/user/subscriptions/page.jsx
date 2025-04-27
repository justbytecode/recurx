
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, DollarSign } from 'lucide-react';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import PaymentProcessorABI from '@/contracts/PaymentProcessor.json';

export default function UserSubscriptions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'user') {
      router.push('/auth/signin');
    } else {
      fetchSubscriptions();
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

  const { config } = usePrepareContractWrite({
    address: process.env.PAYMENT_PROCESSOR_ADDRESS,
    abi: PaymentProcessorABI,
    functionName: 'processSubscriptionPayment',
    args: [], // Will be set dynamically
  });

  const { write: processPayment } = useContractWrite({
    ...config,
    onSuccess: () => {
      toast({
        title: 'Payment Processed',
        description: 'Your subscription payment has been processed.',
      });
      fetchSubscriptions();
    },
    onError: (error) => {
      console.error('Error processing payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment.',
        variant: 'destructive',
      });
    },
  });

  const handlePaySubscription = async (subscriptionId) => {
    const subscription = subscriptions.find((sub) => sub.id === subscriptionId);
    if (!subscription) return;

    try {
      const subscriptionOnChain = await fetch(`/api/merchant/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const { subscriptionId: onChainId } = await subscriptionOnChain.json();

      processPayment?.({ args: [onChainId], value: subscription.plan.amount });
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate payment.',
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Subscriptions</h1>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your Subscriptions</CardTitle>
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
                    <TableHead className="text-sm text-gray-700">Status</TableHead>
                    <TableHead className="text-sm text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-6">
                        No subscriptions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{sub.plan.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{sub.plan.amount}</TableCell>
                        <TableCell className="text-sm text-gray-600">{sub.plan.currency}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {sub.nextBilling ? new Date(sub.nextBilling).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sub.status === 'active'
                                ? 'bg-green-100 text-primary-user'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {sub.status === 'active' && new Date(sub.nextBilling) <= new Date() && (
                            <Button
                              onClick={() => handlePaySubscription(sub.id)}
                              className="flex items-center gap-1 bg-primary-user hover:bg-blue-600"
                            >
                              <DollarSign className="w-4 h-4" />
                              Pay Now
                            </Button>
                          )}
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
