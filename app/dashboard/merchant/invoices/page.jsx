'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input'; // Verify this import
import { Search, Plus } from 'lucide-react';
import { nanoid } from 'nanoid';
import { subscribeToWebSocket, sendWebSocketMessage } from '@/lib/websocket';

export default function Invoices() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [newInvoice, setNewInvoice] = useState({
    customerId: '',
    amount: '',
    currency: 'ETH',
  });
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
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
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices.', {
        style: {
          borderRadius: '8px',
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
        },
      });
    }
  };

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
      if (data.type === 'invoice' && data.userId === session.user.id) {
        setInvoices((prev) => [...prev, data.invoice]);
      }
    });
    return () => ws.close();
  }, [session]);

  const handleAddInvoice = async () => {
    if (!newInvoice.customerId || !newInvoice.amount || isNaN(newInvoice.amount) || Number(newInvoice.amount) <= 0) {
      toast.error('Customer and valid amount are required.', {
        style: {
          borderRadius: '8px',
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
        },
      });
      return;
    }
    const invoiceNo = `INV-${nanoid(8)}`;
    try {
      const response = await fetch('/api/merchant/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ ...newInvoice, invoiceNo, status: 'pending' }),
      });
      if (!response.ok) {
        throw new Error('Failed to add invoice');
      }
      const invoice = await response.json();
      setInvoices([...invoices, invoice]);
      setIsDialogOpen(false);
      setNewInvoice({ customerId: '', amount: '', currency: 'ETH' });
      toast.success('The invoice has been created successfully.', {
        style: {
          borderRadius: '8px',
          background: '#10B981',
          color: '#fff',
          padding: '16px',
        },
      });

      const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
      sendWebSocketMessage(ws, {
        type: 'invoice',
        userId: session.user.id,
        invoice,
      });
    } catch (error) {
      console.error('Error adding invoice:', error);
      toast.error('Failed to add invoice.', {
        style: {
          borderRadius: '8px',
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
        },
      });
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoices</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-gray-300 focus:ring-primary-merchant"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary-merchant hover:bg-emerald-600 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-lg">
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select
                    value={newInvoice.customerId}
                    onValueChange={(value) => setNewInvoice({ ...newInvoice, customerId: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-primary-merchant">
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    className="border-gray-300 focus:ring-primary-merchant"
                  />
                  <Select
                    value={newInvoice.currency}
                    onValueChange={(value) => setNewInvoice({ ...newInvoice, currency: value })}
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
                  <Button onClick={handleAddInvoice} className="bg-primary-merchant hover:bg-emerald-600">
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-700">Invoice No</TableHead>
                    <TableHead className="text-sm text-gray-700">Customer</TableHead>
                    <TableHead className="text-sm text-gray-700">Amount</TableHead>
                    <TableHead className="text-sm text-gray-700">Currency</TableHead>
                    <TableHead className="text-sm text-gray-700">Status</TableHead>
                    <TableHead className="text-sm text-gray-700">Issued At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-6">
                        No invoices found. Create a new invoice to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{invoice.invoiceNo}</TableCell>
                        <TableCell className="text-sm text-gray-600">{invoice.customer?.name || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{invoice.amount}</TableCell>
                        <TableCell className="text-sm text-gray-600">{invoice.currency}</TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'paid'
                                ? 'bg-green-100 text-primary-merchant'
                                : invoice.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(invoice.issuedAt).toLocaleDateString()}
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