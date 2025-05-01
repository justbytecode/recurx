'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

export default function Withdrawals() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState([]);
  const [newWithdrawal, setNewWithdrawal] = useState({
    amount: '',
    currency: 'ETH',
    destinationAddress: '',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else if (!session.user.walletAddress) {
      // Keep popup open
    } else {
      fetchWithdrawals();
    }
  }, [session, status, router]);

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch('/api/merchant/withdrawals', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch withdrawals');
      const data = await response.json();
      setWithdrawals(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load withdrawals.',
        variant: 'destructive',
      });
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!newWithdrawal.amount || !newWithdrawal.destinationAddress) {
      toast({
        title: 'Error',
        description: 'Amount and destination address are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/merchant/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(newWithdrawal),
      });
      if (!response.ok) throw new Error('Failed to request withdrawal');
      const withdrawal = await response.json();
      setWithdrawals([...withdrawals, withdrawal]);
      setIsDialogOpen(false);
      setNewWithdrawal({ amount: '', currency: 'ETH', destinationAddress: '' });
      toast({
        title: 'Success',
        description: 'Withdrawal request submitted successfully.',
      });
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast({
        title: 'Error',
        description: 'Failed to request withdrawal.',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Withdrawals</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">Request Withdrawal</Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 text-white rounded-lg">
            <DialogHeader>
              <DialogTitle>Request New Withdrawal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Amount"
                type="number"
                value={newWithdrawal.amount}
                onChange={(e) => setNewWithdrawal({ ...newWithdrawal, amount: e.target.value })}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Select
                value={newWithdrawal.currency}
                onValueChange={(value) => setNewWithdrawal({ ...newWithdrawal, currency: value })}
              >
                <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Destination Wallet Address"
                value={newWithdrawal.destinationAddress}
                onChange={(e) => setNewWithdrawal({ ...newWithdrawal, destinationAddress: e.target.value })}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Button onClick={handleRequestWithdrawal} className="bg-emerald-500 hover:bg-emerald-600">
                Request Withdrawal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>
      <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Your Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Destination Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>{withdrawal.amount}</TableCell>
                    <TableCell>{withdrawal.currency}</TableCell>
                    <TableCell>{withdrawal.destinationAddress}</TableCell>
                    <TableCell>{withdrawal.status}</TableCell>
                    <TableCell>{new Date(withdrawal.createdAt).toLocaleDateString()}</TableCell>
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