'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Search, Plus, Copy, Wallet } from 'lucide-react';
import { nanoid } from 'nanoid';
import { subscribeToWebSocket, sendWebSocketMessage } from '@/lib/websocket';
import PayRecurxABI from '@/abis/PayRecurx.json';
import { parseEther } from 'viem';

export default function PayLinks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isConnected } = useAccount();
  const [payLinks, setPayLinks] = useState([]);
  const [newPayLink, setNewPayLink] = useState({
    name: '',
    amount: '',
    currency: 'ETH',
    type: 'one-time',
    redirectUrl: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const { config } = usePrepareContractWrite({
    address: process.env.NEXT_PUBLIC_PAYRECURX_CONTRACT_ADDRESS,
    abi: PayRecurxABI,
    functionName: 'processPayLinkPayment',
    args: [
      session?.user?.walletAddress,
      newPayLink.amount ? parseEther(newPayLink.amount) : '0',
      newPayLink.currency,
    ],
    enabled: !!session?.user?.walletAddress && !!newPayLink.amount && newPayLink.currency !== 'ETH',
  });

  const { write: processPayLinkPayment } = useContractWrite(config);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
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
      toast.error('Failed to load pay links.');
    }
  };

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.type === 'payLink' && data.userId === session.user.id) {
        setPayLinks((prev) => [...prev.filter((l) => l.id !== data.payLink.id), data.payLink]);
      }
    });
    return () => ws.close();
  }, [session]);

  const checkWalletAndProceed = () => {
    if (!isConnected || !session.user.walletAddress) {
      setIsWalletModalOpen(true);
      return false;
    }
    return true;
  };

  const handleAddPayLink = async () => {
    if (!checkWalletAndProceed()) return;
    if (!newPayLink.name || !newPayLink.amount || isNaN(newPayLink.amount) || Number(newPayLink.amount) <= 0) {
      toast.error('Name and valid amount are required.');
      return;
    }
    const url = `https://app.recurx.com/pay/${nanoid(10)}`;
    try {
      // For non-ETH, prepare contract call (ERC-20)
      if (newPayLink.currency !== 'ETH') {
        await processPayLinkPayment?.();
      }
      const response = await fetch('/api/merchant/pay-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ ...newPayLink, url, merchantWallet: session.user.walletAddress }),
      });
      if (!response.ok) throw new Error('Failed to add pay link');
      const payLink = await response.json();
      setPayLinks([...payLinks, payLink]);
      setIsDialogOpen(false);
      setNewPayLink({ name: '', amount: '', currency: 'ETH', type: 'one-time', redirectUrl: '' });
      toast.success('Pay link created successfully.');

      const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
      sendWebSocketMessage(ws, {
        type: 'payLink',
        userId: session.user.id,
        payLink,
      });
    } catch (error) {
      console.error('Error adding pay link:', error);
      toast.error('Failed to add pay link.');
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Pay link URL copied to clipboard.');
  };

  const filteredPayLinks = payLinks.filter(
    (link) => link.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pay Links</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search pay links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-gray-300 focus:ring-primary-merchant"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary-merchant hover:bg-emerald-600 flex items-center gap-2"
                  onClick={checkWalletAndProceed}
                >
                  <Plus className="w-4 h-4" />
                  Create Pay Link
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-lg">
                <DialogHeader>
                  <DialogTitle>Create New Pay Link</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Link Name"
                    value={newPayLink.name}
                    onChange={(e) => setNewPayLink({ ...newPayLink, name: e.target.value })}
                    className="border-gray-300 focus:ring-primary-merchant"
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newPayLink.amount}
                    onChange={(e) => setNewPayLink({ ...newPayLink, amount: e.target.value })}
                    className="border-gray-300 focus:ring-primary-merchant"
                  />
                  <Select
                    value={newPayLink.currency}
                    onValueChange={(value) => setNewPayLink({ ...newPayLink, currency: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-primary-merchant">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newPayLink.type}
                    onValueChange={(value) => setNewPayLink({ ...newPayLink, type: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-primary-merchant">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-Time</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Redirect URL (optional)"
                    value={newPayLink.redirectUrl}
                    onChange={(e) => setNewPayLink({ ...newPayLink, redirectUrl: e.target.value })}
                    className="border-gray-300 focus:ring-primary-merchant"
                  />
                  <Button onClick={handleAddPayLink} className="bg-primary-merchant hover:bg-emerald-600">
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your Pay Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-700">Name</TableHead>
                    <TableHead className="text-sm text-gray-700">Amount</TableHead>
                    <TableHead className="text-sm text-gray-700">Currency</TableHead>
                    <TableHead className="text-sm text-gray-700">Type</TableHead>
                    <TableHead className="text-sm text-gray-700">URL</TableHead>
                    <TableHead className="text-sm text-gray-700">Status</TableHead>
                    <TableHead className="text-sm text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayLinks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-6">
                        No pay links found. Create a new pay link to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayLinks.map((link) => (
                      <TableRow key={link.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{link.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{link.amount}</TableCell>
                        <TableCell className="text-sm text-gray-600">{link.currency}</TableCell>
                        <TableCell className="text-sm text-gray-600">{link.type}</TableCell>
                        <TableCell className="text-sm text-gray-600 truncate max-w-[200px]">{link.url}</TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              link.active ? 'bg-green-100 text-primary-merchant' : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {link.active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyUrl(link.url)}
                            className="flex items-center gap-1 border-gray-300 hover:bg-gray-100"
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Not Connected Modal */}
        <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Wallet Not Connected</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please connect your wallet to create pay links.
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