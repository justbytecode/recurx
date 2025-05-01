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
import { Copy, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function PayLinks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payLinks, setPayLinks] = useState([]);
  const [newPayLink, setNewPayLink] = useState({
    name: '',
    amount: '',
    currency: 'ETH',
    type: 'one-time',
    redirectUrl: '',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else if (!session.user.walletAddress) {
      // Keep popup open
    } else {
      fetchPayLinks();
    }
  }, [session, status, router]);

  const fetchPayLinks = async () => {
    try {
      const response = await fetch('/api/merchant/pay-links', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch pay links');
      const data = await response.json();
      setPayLinks(data);
    } catch (error) {
      console.error('Error fetching pay links:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pay links.',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePayLink = async () => {
    if (!newPayLink.name || !newPayLink.amount) {
      toast({
        title: 'Error',
        description: 'Name and amount are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/merchant/pay-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(newPayLink),
      });
      if (!response.ok) throw new Error('Failed to create pay link');
      const payLink = await response.json();
      setPayLinks([...payLinks, payLink]);
      setIsDialogOpen(false);
      setNewPayLink({ name: '', amount: '', currency: 'ETH', type: 'one-time', redirectUrl: '' });
      navigator.clipboard.writeText(`${window.location.origin}/${payLink.url}`);
      toast({
        title: 'Pay Link Created',
        description: 'Pay link copied to clipboard.',
      });
    } catch (error) {
      console.error('Error creating pay link:', error);
      toast({
        title: 'Error',
        description: 'Failed to create pay link.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(`${window.location.origin}/${url}`);
    toast({
      title: 'Copied',
      description: 'Pay link copied to clipboard.',
    });
  };

  const handleDeactivateLink = async (id) => {
    try {
      await fetch(`/api/merchant/pay-links/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ active: false }),
      });
      setPayLinks(payLinks.map((link) => (link.id === id ? { ...link, active: false } : link)));
      toast({
        title: 'Success',
        description: 'Pay link deactivated.',
      });
    } catch (error) {
      console.error('Error deactivating pay link:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate pay link.',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Pay Links</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">Create Pay Link</Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 text-white rounded-lg">
            <DialogHeader>
              <DialogTitle>Create New Pay Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Name"
                value={newPayLink.name}
                onChange={(e) => setNewPayLink({ ...newPayLink, name: e.target.value })}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Input
                placeholder="Amount"
                type="number"
                value={newPayLink.amount}
                onChange={(e) => setNewPayLink({ ...newPayLink, amount: e.target.value })}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Select
                value={newPayLink.currency}
                onValueChange={(value) => setNewPayLink({ ...newPayLink, currency: value })}
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
                value={newPayLink.type}
                onValueChange={(value) => setNewPayLink({ ...newPayLink, type: value })}
              >
                <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="one-time">One-Time</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Redirect URL (optional)"
                value={newPayLink.redirectUrl}
                onChange={(e) => setNewPayLink({ ...newPayLink, redirectUrl: e.target.value })}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Button onClick={handleCreatePayLink} className="bg-emerald-500 hover:bg-emerald-600">
                Create Pay Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>
      <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Your Pay Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>{link.name}</TableCell>
                    <TableCell>{link.amount}</TableCell>
                    <TableCell>{link.currency}</TableCell>
                    <TableCell>{link.type}</TableCell>
                    <TableCell>{link.active ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell>{new Date(link.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(link.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {link.active && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeactivateLink(link.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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