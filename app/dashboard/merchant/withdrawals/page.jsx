'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Withdrawals() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar role={session.user.role} />
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Withdrawals</h1>
        </header>
        <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Withdrawals are an upcoming feature and are not yet available.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}