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
import { toast } from '@/components/ui/use-toast';

export default function Customers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', walletAddress: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else if (!session.user.walletAddress) {
      // Keep popup open
    } else {
      fetchCustomers();
    }
  }, [session, status, router]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/merchant/customers', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers.',
        variant: 'destructive',
      });
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.walletAddress) {
      toast({
        title: 'Error',
        description: 'Name and wallet address are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/merchant/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(newCustomer),
      });
      if (!response.ok) throw new Error('Failed to add customer');
      const customer = await response.json();
      setCustomers([...customers, customer]);
      setIsDialogOpen(false);
      setNewCustomer({ name: '', email: '', walletAddress: '' });
      toast({
        title: 'Success',
        description: 'Customer added successfully.',
      });
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to add customer.',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Customers</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">Add Customer</Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 text-white rounded-lg">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Input
                placeholder="Email (optional)"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Input
                placeholder="Wallet Address"
                value={newCustomer.walletAddress}
                onChange={(e) => setNewCustomer({ ...newCustomer, walletAddress: e.target.value })}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Button onClick={handleAddCustomer} className="bg-emerald-500 hover:bg-emerald-600">
                Add Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>
      <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Your Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{customer.walletAddress}</TableCell>
                    <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
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