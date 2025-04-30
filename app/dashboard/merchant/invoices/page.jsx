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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Search, Plus } from 'lucide-react';
import { subscribeToWebSocket } from '@/lib/websocket';

export default function Invoices() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [newInvoice, setNewInvoice] = useState({
    customerId: '',
    amount: '',
    currency: 'USD',
    invoiceNo: '',
    status: 'pending',
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
      fetchInvoices();
      fetchCustomers();
    }
  }, [session, status, router]);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/merchant/invoices', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoices.',
        variant: 'destructive',
      });
    }
  };

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

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.type === 'invoice' && data.userId === session.user.id) {
        setInvoices((prev) => [...prev, data.invoice]);
      }
    });
    return () => ws.close();
  }, [session]);

  const handleAddInvoice = async () => {
    if (!newInvoice.customerId || !newInvoice.amount || !newInvoice.invoiceNo) {
      toast({
        title: 'Error',
        description: 'Customer, amount, and invoice number are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/merchant/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(newInvoice),
      });
      if (!response.ok) throw new Error('Failed to add invoice');
      const invoice = await response.json();
      setInvoices([...invoices, invoice]);
      setIsDialogOpen(false);
      setNewInvoice({ customerId: '', amount: '', currency: 'USD', invoiceNo: '', status: 'pending' });
      toast({
        title: 'Success',
        description: 'Invoice created successfully.',
      });
    } catch (error) {
      console.error('Error adding invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice.',
        variant: 'destructive',
      });
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customers.find((c) => c.id === invoice.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar role={session.user.role} />
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Invoices</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-gray-800 border-gray-700 text-white focus:ring-emerald-500"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" /> Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white rounded-lg">
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select
                    onValueChange={(value) => setNewInvoice({ ...newInvoice, customerId: value })}
                    value={newInvoice.customerId}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white focus:ring-emerald-500"
                  />
                  <Select
                    onValueChange={(value) => setNewInvoice({ ...newInvoice, currency: value })}
                    value={newInvoice.currency}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Invoice Number"
                    value={newInvoice.invoiceNo}
                    onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNo: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white focus:ring-emerald-500"
                  />
                  <Button onClick={handleAddInvoice} className="bg-emerald-500 hover:bg-emerald-600">
                    Create Invoice
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Your Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-300">Invoice No</TableHead>
                    <TableHead className="text-sm text-gray-300">Customer</TableHead>
                    <TableHead className="text-sm text-gray-300">Amount</TableHead>
                    <TableHead className="text-sm text-gray-300">Currency</TableHead>
                    <TableHead className="text-sm text-gray-300">Status</TableHead>
                    <TableHead className="text-sm text-gray-300">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-400 py-6">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-gray-800">
                        <TableCell className="font-medium text-sm text-white">{invoice.invoiceNo}</TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {customers.find((c) => c.id === invoice.customerId)?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">{invoice.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-gray-400">{invoice.currency}</TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-green-100 text-emerald-600'
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {new Date(invoice.createdAt).toLocaleDateString()}
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