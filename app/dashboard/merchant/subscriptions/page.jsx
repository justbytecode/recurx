'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { useAccount } from 'wagmi';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { Search, Trash2, Edit, Wallet } from 'lucide-react';
import { subscribeToWebSocket } from '@/lib/websocket';

export default function MerchantSubscriptions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isConnected } = useAccount();
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'ETH',
    interval: 'monthly',
    type: 'subscription',
    description: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else {
      fetchSubscriptions();
      fetchPlans();
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.type(cc) === 'subscription' && data.userId === session.user.id) {
        setSubscriptions((prev) => [...prev.filter((s) => s.id !== data.subscription.id), data.subscription]);
      }
      if (data.type === 'plan' && data.userId === session.user.id) {
        if (data.action === 'created') {
          setPlans((prev) => [...prev, data.plan]);
        } else if (data.action === 'updated') {
          setPlans((prev) => prev.map((p) => (p.id === data.plan.id ? data.plan : p)));
        } else if (data.action === 'deleted') {
          setPlans((prev) => prev.filter((p) => p.id !== data.plan.id));
        }
      }
    });
    return () => ws.close();
  }, [session]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/merchant/subscriptions', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions.');
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/merchant/subscriptions/plans', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load plans.');
    }
  };

  const checkWalletAndProceed = (action) => {
    if (!isConnected || !session.user.walletAddress) {
      setIsWalletModalOpen(true);
      return false;
    }
    return true;
  };

  const handleCreatePlan = async () => {
    if (!checkWalletAndProceed('create')) return;
    try {
      const response = await fetch('/api/merchant/subscriptions/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to create plan');
      }
      toast.success('Plan created successfully.');
      setIsCreateModalOpen(false);
      setFormData({ name: '', amount: '', currency: 'ETH', interval: 'monthly', type: 'subscription', description: '' });
      fetchPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error(error.message || 'Failed to create plan.');
    }
  };

  const handleEditPlan = async () => {
    if (!checkWalletAndProceed('edit')) return;
    try {
      const response = await fetch(`/api/merchant/subscriptions/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to update plan');
      }
      toast.success('Plan updated successfully.');
      setIsEditModalOpen(false);
      setSelectedPlan(null);
      setFormData({ name: '', amount: '', currency: 'ETH', interval: 'monthly', type: 'subscription', description: '' });
      fetchPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error(error.message || 'Failed to update plan.');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!checkWalletAndProceed('delete')) return;
    try {
      const response = await fetch(`/api/merchant/subscriptions/plans/${planId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to delete plan');
      }
      toast.success('Plan deleted successfully.');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error(error.message || 'Failed to delete plan.');
    }
  };

  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      sub.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Subscriptions</h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-gray-300 focus:ring-primary-merchant"
              />
            </div>
            <Button
              onClick={() => {
                if (!checkWalletAndProceed('create')) return;
                setIsCreateModalOpen(true);
              }}
              className="bg-primary-merchant hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
            >
              Create Subscription Plan
            </Button>
          </div>
        </header>

        {/* Subscription Plans Table */}
        <Card className="shadow-lg bg-white rounded-xl mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your Subscription Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-700">Plan Name</TableHead>
                    <TableHead className="text-sm text-gray-700">Amount</TableHead>
                    <TableHead className="text-sm text-gray-700">Currency</TableHead>
                    <TableHead className="text-sm text-gray-700">Interval</TableHead>
                    <TableHead className="text-sm text-gray-700">Type</TableHead>
                    <TableHead className="text-sm text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-6">
                        No plans found. Create a plan to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map((plan) => (
                      <TableRow key={plan.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{plan.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{plan.amount}</TableCell>
                        <TableCell className="text-sm text-gray-600">{plan.currency}</TableCell>
                        <TableCell className="text-sm text-gray-600">{plan.interval}</TableCell>
                        <TableCell className="text-sm text-gray-600">{plan.type}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!checkWalletAndProceed('edit')) return;
                                setSelectedPlan(plan);
                                setFormData({
                                  name: plan.name,
                                  amount: plan.amount,
                                  currency: plan.currency,
                                  interval: plan.interval,
                                  type: plan.type,
                                  description: plan.description || '',
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="flex items-center gap-2 border-gray-300 hover:bg-gray-100"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size=" sm"
                              onClick={() => handleDeletePlan(plan.id)}
                              className="flex items-center gap-2 border-gray-300 hover:bg-red-100 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Customer Subscriptions Table */}
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Customer Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-700">Plan Name</TableHead>
                    <TableHead className="text-sm text-gray-700">Customer</TableHead>
                    <TableHead className="text-sm text-gray-700">Amount</TableHead>
                    <TableHead className="text-sm text-gray-700">Currency</TableHead>
                    <TableHead className="text-sm text-gray-700">Status</TableHead>
                    <TableHead className="text-sm text-gray-700">Next Billing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-6">
                        No subscriptions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{sub.plan?.name || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{sub.customer?.name || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{sub.plan?.amount || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{sub.plan?.currency || 'N/A'}</TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sub.status === 'active'
                                ? 'bg-green-100 text-primary-merchant'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </TableCell>
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

        {/* Create Plan Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Plan Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Premium Plan"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Access to premium features"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Amount</label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g., 0.01"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-merchant focus:ring focus:ring-primary-merchant focus:ring-opacity-50"
                >
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Interval</label>
                <select
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-merchant focus:ring focus:ring-primary-merchant focus:ring-opacity-50"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-merchant focus:ring focus:ring-primary-merchant focus:ring-opacity-50"
                >
                  <option value="subscription">Subscription</option>
                  <option value="one-time">One-Time</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePlan}
                className="bg-primary-merchant hover:bg-emerald-600 text-white"
              >
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Plan Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Subscription Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Plan Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Premium Plan"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Access to premium features"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Amount</label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g., 0.01"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-merchant focus:ring focus:ring-primary-merchant focus:ring-opacity-50"
                >
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Interval</label>
                <select
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-merchant focus:ring focus:ring-primary-merchant focus:ring-opacity-50"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-merchant focus:ring focus:ring-primary-merchant focus:ring-opacity-50"
                >
                  <option value="subscription">Subscription</option>
                  <option value="one-time">One-Time</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedPlan(null);
                }}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditPlan}
                className="bg-primary-merchant hover:bg-emerald-600 text-white"
              >
                Update Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Wallet Not Connected Modal */}
        <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Wallet Not Connected</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please connect your wallet to manage subscription plans.
              </p>
              <Button
                onClick={() => router.push('/dashboard/merchant/wallet')}
                className="w-full bg-primary-merchant hover:bg-emerald-600 text-white flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}