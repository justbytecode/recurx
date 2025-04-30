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
import { Copy, Plus, Trash2 } from 'lucide-react';
import { subscribeToWebSocket } from '@/lib/websocket';
import { nanoid } from 'nanoid';

export default function UserPayLinks() {
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
    if (!session || session.user.role !== 'user') {
      router.push('/auth/signin');
    } else if (!session.user.walletAddress) {
      // Keep popup open
    } else {
      fetchPayLinks();
    }
  }, [session, status, router]);

  const fetchPayLinks = async () => {
    try {
      const response = await fetch('/api/user/pay-links', {
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

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.type === 'payLink' && data.userId === session.user.id) {
        setPayLinks((prev) => [...prev, data.payLink]);
      }
    });
    return () => ws.close();
  }, [session]);

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
      const response = await fetch('/api/user/pay-links', {
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

  const handleDeletePayLink = async (id) => {
    try {
      await fetch(`/api/user/pay-links/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setPayLinks(payLinks.filter((link) => link.id !== id));
      toast({
        title: 'Success',
        description: 'Pay link deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting pay link:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete pay link.',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar role={session.user.role} />
      {!session.user.walletAddress && <WalletConnectPopup role="user" />}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Pay Links</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="w-4 h-4 mr-2" /> Create Pay Link
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 text-white rounded-lg">
              <DialogHeader>
                <DialogTitle>Create New Pay Link</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Pay Link Name"
                  value={newPayLink.name}
                  onChange={(e) => setNewPayLink({ ...newPayLink, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white focus:ring-emerald-500"
                />
                <Input
                  placeholder="Amount"
                  type="number"
                  value={newPayLink.amount}
                  onChange={(e) => setNewPayLink({ ...newPayLink, amount: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white focus:ring-emerald-500"
                />
                <Select
                  onValueChange={(value) => setNewPayLink({ ...newPayLink, currency: value })}
                  value={newPayLink.currency}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="DAI">DAI</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(value) => setNewPayLink({ ...newPayLink, type: value })}
                  value={newPayLink.type}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="one-time">One-Time</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Redirect URL (optional)"
                  value={newPayLink.redirectUrl}
                  onChange={(e) => setNewPayLink({ ...newPayLink, redirectUrl: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white focus:ring-emerald-500"
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
                    <TableHead className="text-sm text-gray-300">Name</TableHead>
                    <TableHead className="text-sm text-gray-300">Amount</TableHead>
                    <TableHead className="text-sm text-gray-300">Currency</TableHead>
                    <TableHead className="text-sm text-gray-300">Type</TableHead>
                    <TableHead className="text-sm text-gray-300">Status</TableHead>
                    <TableHead className="text-sm text-gray-300">Created</TableHead>
                    <TableHead className="text-sm text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payLinks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-400 py-6">
                        No pay links found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payLinks.map((link) => (
                      <TableRow key={link.id} className="hover:bg-gray-800">
                        <TableCell className="font-medium text-sm text-white">{link.name}</TableCell>
                        <TableCell className="text-sm text-gray-400">{link.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-gray-400">{link.currency}</TableCell>
                        <TableCell className="text-sm text-gray-400">{link.type}</TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              link.active ? 'bg-green-100 text-emerald-600' : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {link.active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {new Date(link.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(link.url)}
                              className="flex items-center gap-1 border-gray-700 hover:bg-gray-700 text-white"
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePayLink(link.id)}
                              className="flex items-center gap-1 border-gray-700 hover:bg-red-700 text-red-400"
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
      </div>
    </div>
  );
}