'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {  Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster } from '@/components/ui/toaster';
import { Plus, Search } from 'lucide-react';
import { subscribeToWebSocket, sendWebSocketMessage } from '@/lib/websocket';
import { Input } from '@/components/ui/input';

export default function Plans() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    amount: '',
    currency: 'ETH',
    interval: 'monthly',
    type: 'subscription',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else {
      fetchPlans();
    }
  }, [session, status, router]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/merchant/plans', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load plans.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.type === 'plan' && data.userId === session.user.id) {
        setPlans((prev) => [...prev, data.plan]);
      }
    });
    return () => ws.close();
  }, [session]);

  const handleAddPlan = async () => {
    if (!newPlan.name || !newPlan.amount || isNaN(newPlan.amount) || Number(newPlan.amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Name and valid amount are required.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const response = await fetch('/api/merchant/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(newPlan),
      });
      if (!response.ok) {
        throw new Error('Failed to add plan');
      }
      const plan = await response.json();
      setPlans([...plans, plan]);
      setIsDialogOpen(false);
      setNewPlan({ name: '', description: '', amount: '', currency: 'ETH', interval: 'monthly', type: 'subscription' });
      toast({
        title: 'Plan Added',
        description: 'The plan has been added successfully.',
      });

      const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
      sendWebSocketMessage(ws, {
        type: 'plan',
        userId: session.user.id,
        plan,
      });
    } catch (error) {
      console.error('Error adding plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to add plan.',
        variant: 'destructive',
      });
    }
  };

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Plans</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-gray-300 focus:ring-primary-merchant"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary-merchant hover:bg-emerald-600 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-lg">
                <DialogHeader>
                  <DialogTitle>Add New Plan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Plan Name"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    className="border-gray-300 focus:ring-primary-merchant"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                    className="border-gray-300 focus:ring-primary-merchant"
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newPlan.amount}
                    onChange={(e) => setNewPlan({ ...newPlan, amount: e.target.value })}
                    className="border-gray-300 focus:ring-primary-merchant"
                  />
                  <Select
                    value={newPlan.currency}
                    onValueChange={(value) => setNewPlan({ ...newPlan, currency: value })}
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
                    value={newPlan.interval}
                    onValueChange={(value) => setNewPlan({ ...newPlan, interval: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-primary-merchant">
                      <SelectValue placeholder="Select Interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newPlan.type}
                    onValueChange={(value) => setNewPlan({ ...newPlan, type: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-primary-merchant">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="one-time">One-Time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddPlan} className="bg-primary-merchant hover:bg-emerald-600">
                    Add
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-700">Name</TableHead>
                    <TableHead className="text-sm text-gray-700">Amount</TableHead>
                    <TableHead className="text-sm text-gray-700">Currency</TableHead>
                    <TableHead className="text-sm text-gray-700">Interval</TableHead>
                    <TableHead className="text-sm text-gray-700">Type</TableHead>
                    <TableHead className="text-sm text-gray-700">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-6">
                        No plans found. Add a new plan to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlans.map((plan) => (
                      <TableRow key={plan.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{plan.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{plan.amount}</TableCell>
                        <TableCell className="text-sm text-gray-600">{plan.currency}</TableCell>
                        <TableCell className="text-sm text-gray-600">{plan.interval}</TableCell>
                        <TableCell className="text-sm text-gray-600">{plan.type}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(plan.createdAt).toLocaleDateString()}
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
