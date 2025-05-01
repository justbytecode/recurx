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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Trash2 } from 'lucide-react';

export default function Plans() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    amount: '',
    currency: 'ETH',
    interval: 'month',
    type: 'recurring',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else if (!session.user.walletAddress) {
      // Keep popup open
    } else {
      fetchPlans();
    }
  }, [session, status, router]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/merchant/plans', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch plans');
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

  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.amount) {
      toast({
        title: 'Error',
        description: 'Name and amount are required.',
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
      if (!response.ok) throw new Error('Failed to create plan');
      const plan = await response.json();
      setPlans([...plans, plan]);
      setIsDialogOpen(false);
      setNewPlan({ name: '', description: '', amount: '', currency: 'ETH', interval: 'month', type: 'recurring' });
      toast({
        title: 'Success',
        description: 'Plan created successfully.',
      });
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to create plan.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlan = async (id) => {
    try {
      await fetch('/api/merchant/plans', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ id }),
      });
      setPlans(plans.filter((plan) => plan.id !== id));
      toast({
        title: 'Success',
        description: 'Plan deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete plan.',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Plans</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">Create Plan</Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 text-white rounded-lg">
            <DialogHeader>
              <DialogTitle>Create New Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Name"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Textarea
                placeholder="Description (optional)"
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Input
                placeholder="Amount"
                type="number"
                value={newPlan.amount}
                onChange={(e) => setNewPlan({ ...newPlan, amount: e.target.value })}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Select
                value={newPlan.currency}
                onValueChange={(value) => setNewPlan({ ...newPlan, currency: value })}
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
              <Select
                value={newPlan.interval}
                onValueChange={(value) => setNewPlan({ ...newPlan, interval: value })}
              >
                <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Select Interval" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={newPlan.type}
                onValueChange={(value) => setNewPlan({ ...newPlan, type: value })}
              >
                <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="recurring">Recurring</SelectItem>
                  <SelectItem value="one-time">One-Time</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreatePlan} className="bg-emerald-500 hover:bg-emerald-600">
                Create Plan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>
      <Card className="shadow-lg bg-gray-800 rounded-xl border-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Your Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{plan.amount}</TableCell>
                    <TableCell>{plan.currency}</TableCell>
                    <TableCell>{plan.interval}</TableCell>
                    <TableCell>{plan.type}</TableCell>
                    <TableCell>{new Date(plan.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
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