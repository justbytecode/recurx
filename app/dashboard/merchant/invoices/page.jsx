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

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Invoices</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">Create Invoice</Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 text-white rounded-lg">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select
                value={newInvoice.customerId}
                onValueChange={(value) => setNewInvoice({ ...newInvoice, customerId: value })}
              >
                <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
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
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Select
                value={newInvoice.currency}
                onValueChange={(value) => setNewInvoice({ ...newInvoice, currency: value })}
              >
                <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Invoice Number"
                value={newInvoice.invoiceNo}
                onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNo: e.target.value })}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Button onClick={handleAddInvoice} className="bg-emerald-500 hover:bg-emerald-600">
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoiceNo}</TableCell>
                    <TableCell>{invoice.customer?.name || '-'}</TableCell>
                    <TableCell>{invoice.amount}</TableCell>
                    <TableCell>{invoice.currency}</TableCell>
                    <TableCell>{invoice.status}</TableCell>
                    <TableCell>{new Date(invoice.issuedAt).toLocaleDateString()}</TableCell>
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