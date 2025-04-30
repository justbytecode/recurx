'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { subscribeToWebSocket } from '@/lib/websocket';

export default function Analytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else if (!session.user.walletAddress) {
      // Keep popup open
    } else {
      fetchAnalytics();
      setIsLoading(false);
    }
  }, [session, status, router]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/merchant/transactions', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const transactions = await response.json();
      const data = transactions.reduce((acc, tx) => {
        const date = new Date(tx.createdAt).toLocaleDateString();
        const existing = acc.find((item) => item.date === date);
        if (existing) {
          existing.amount += tx.amount;
        } else {
          acc.push({ date, amount: tx.amount });
        }
        return acc;
      }, []).slice(-30);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.type === 'transaction' && data.userId === session.user.id && data.transaction.status === 'completed') {
        const date = new Date(data.transaction.createdAt).toLocaleDateString();
        setAnalyticsData((prev) => {
          const existing = prev.find((item) => item.date === date);
          if (existing) {
            existing.amount += data.transaction.amount;
            return [...prev];
          }
          return [...prev, { date, amount: data.transaction.amount }].slice(-30);
        });
      }
    });
    return () => ws.close();
  }, [session]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar role={session.user.role} />
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
        </header>
        <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Transaction Volume (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center">No transaction data available.</p>
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', borderRadius: '8px', border: 'none' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}