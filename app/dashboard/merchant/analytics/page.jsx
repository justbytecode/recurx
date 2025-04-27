'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // Import toast from react-hot-toast
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
      toast.error('Failed to load analytics data.', {
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
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-primary-merchant" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral">Analytics</h1>
        </header>
        <Card className="shadow-card animate-fade-in bg-white">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold text-neutral">
              Transaction Volume (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">No transaction data available.</p>
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none' }}
                      labelStyle={{ color: '#1f2937' }}
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