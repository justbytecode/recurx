'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast'; // Import toast from react-hot-toast
import { Search, Plus } from 'lucide-react';
import { subscribeToWebSocket, sendWebSocketMessage } from '@/lib/websocket';

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
      toast.error('Failed to load customers.', {
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
      if (data.type === 'customer' && data.userId === session.user.id) {
        setCustomers((prev) => [...prev, data.customer]);
      }
    });
    return () => ws.close();
  }, [session]);

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.walletAddress) {
      toast.error('Name and wallet address are required.', {
        style: {
          borderRadius: '8px',
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
        },
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
      toast.success('The customer has been added successfully.', {
        style: {
          borderRadius: '8px',
          background: '#10B981',
          color: '#fff',
          padding: '16px',
        },
      });

      const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
      sendWebSocketMessage(ws, {
        type: 'customer',
        userId: session.user.id,
        customer,
      });
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer.', {
        style: {
          borderRadius: '8px',
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
        },
      });
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-gray-300 focus:ring-primary-merchant"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary-merchant hover:bg-emerald-600 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-lg">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="border-gray-300 focus:ring-primary-merchant"
                  />
                  <Input
                    placeholder="Email (optional)"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="border-gray-300 focus:ring-primary-merchant"
                  />
                  <Input
                    placeholder="Wallet Address"
                    value={newCustomer.walletAddress}
                    onChange={(e) => setNewCustomer({ ...newCustomer, walletAddress: e.target.value })}
                    className="border-gray-300 focus:ring-primary-merchant"
                  />
                  <Button onClick={handleAddCustomer} className="bg-primary-merchant hover:bg-emerald-600">
                    Add
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-700">Name</TableHead>
                    <TableHead className="text-sm text-gray-700">Email</TableHead>
                    <TableHead className="text-sm text-gray-700">Wallet Address</TableHead>
                    <TableHead className="text-sm text-gray-700">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-6">
                        No customers found. Add a new customer to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{customer.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{customer.email || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-gray-600 truncate max-w-[200px]">
                          {customer.walletAddress}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
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