'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WalletConnectPopup from '@/components/WalletConnectPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Search, Plus } from 'lucide-react';
import { subscribeToWebSocket } from '@/lib/websocket';

export default function Customers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    walletAddress: '',
    billingDetails: {},
  });
  const [searchTerm, setSearchTerm] = useState('');
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
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
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

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.type === 'customer' && data.userId === session.user.id) {
        setCustomers((prev) => [...prev, data.customer]);
      }
    });
    return () => ws.close();
  }, [session]);

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
      if (!response.ok) {
        throw new Error('Failed to add customer');
      }
      const customer = await response.json();
      setCustomers([...customers, customer]);
      setIsDialogOpen(false);
      setNewCustomer({ name: '', email: '', walletAddress: '', billingDetails: {} });
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

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar role={session.user.role} />
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Customers</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-gray-800 border-gray-700 text-white focus:ring-emerald-500"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" /> Add Customer
                </Button>
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
                    className="bg-gray-800 border-gray-700 text-white focus:ring-emerald-500"
                  />
                  <Input
                    placeholder="Email (optional)"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white focus:ring-emerald-500"
                  />
                  <Input
                    placeholder="Wallet Address"
                    value={newCustomer.walletAddress}
                    onChange={(e) => setNewCustomer({ ...newCustomer, walletAddress: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white focus:ring-emerald-500"
                  />
                  <Button onClick={handleAddCustomer} className="bg-emerald-500 hover:bg-emerald-600">
                    Add Customer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                    <TableHead className="text-sm text-gray-300">Name</TableHead>
                    <TableHead className="text-sm text-gray-300">Email</TableHead>
                    <TableHead className="text-sm text-gray-300">Wallet Address</TableHead>
                    <TableHead className="text-sm text-gray-300">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-gray-400 py-6">
                        No customers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-gray-800">
                        <TableCell className="font-medium text-sm text-white">{customer.name}</TableCell>
                        <TableCell className="text-sm text-gray-400">{customer.email || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {customer.walletAddress.slice(0, 6)}...{customer.walletAddress.slice(-4)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {new Date(customer.createdAt).toLocaleDateString()}
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