'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Search, Plus } from 'lucide-react';
import { subscribeToWebSocket, sendWebSocketMessage } from '@/lib/websocket';

export default function Withdrawals() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState([]);
  const [newWithdrawal, setNewWithdrawal] = useState({
    amount: '',
    currency: 'ETH',
    method: 'crypto',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else {
      fetchWithdrawals();
    }
  }, [session, status, router]);

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch('/api/merchant/withdrawals', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch withdrawals');
      }
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

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.type === 'withdrawal' && data.userId === session.user.id) {
        setWithdrawals((prev) => [...prev, data.withdrawal]);
      }
    });
    return () => ws.close();
  }, [session]);

  const handleAddWithdrawal = async () => {
    if (!newWithdrawal.amount || isNaN(newWithdrawal.amount) || Number(newWithdrawal.amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Valid amount is required.',
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
        body: JSON.stringify({ ...newWithdrawal, status: 'pending' }),
      });
      if (!response.ok) {
        throw new Error('Failed to add withdrawal');
      }
      const withdrawal = await response.json();
      setWithdrawals([...withdrawals, withdrawal]);
      setIsDialogOpen(false);
      setNewWithdrawal({ amount: '', currency: 'ETH', method: 'crypto' });
      toast({
        title: 'Withdrawal Requested',
        description: 'Your withdrawal request has been submitted.',
      });

      const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
      sendWebSocketMessage(ws, {
        type: 'withdrawal',
        userId: session.user.id,
        withdrawal,
      });
    } catch (error) {
      console.error('Error adding withdrawal:', error);
      toast({
        title: 'Error',
        description: 'Failed to add withdrawal.',
        variant: 'destructive',
      });
    }
  };

  const filteredWithdrawals = withdrawals.filter(
    (withdrawal) => withdrawal.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Withdrawals</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search withdrawals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-gray-300 focus:ring-primary-merchant"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary-merchant hover:bg-emerald-600 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Request Withdrawal
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-lg">
                <DialogHeader>
                  <DialogTitle>Request New Withdrawal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newWithdrawal.amount}
                    onChange={(e) => setNewWithdrawal({ ...newWithdrawal, amount: e.target.value })}
                    className="border-gray-300 focus:ring-primary-merchant"
                  />
                  <Select
                    value={newWithdrawal.currency}
                    onValueChange={(value) => setNewWithdrawal({ ...newWithdrawal, currency: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-primary-merchant">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="MATIC">MATIC</SelectItem>
                      <SelectItem value="BNB">BNB</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newWithdrawal.method}
                    onValueChange={(value) => setNewWithdrawal({ ...newWithdrawal, method: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-primary-merchant">
                      <SelectValue placeholder="Select Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddWithdrawal} className="bg-primary-merchant hover:bg-emerald-600">
                    Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-700">Amount</TableHead>
                    <TableHead className="text-sm text-gray-700">Currency</TableHead>
                    <TableHead className="text-sm text-gray-700">Method</TableHead>
                    <TableHead className="text-sm text-gray-700">Status</TableHead>
                    <TableHead className="text-sm text-gray-700">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-gray-500 py-6">
                        No withdrawals found. Request a new withdrawal to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWithdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{withdrawal.amount}</TableCell>
                        <TableCell className="text-sm text-gray-600">{withdrawal.currency}</TableCell>
                        <TableCell className="text-sm text-gray-600">{withdrawal.method}</TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              withdrawal.status === 'completed'
                                ? 'bg-green-100 text-primary-merchant'
                                : withdrawal.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {withdrawal.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
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