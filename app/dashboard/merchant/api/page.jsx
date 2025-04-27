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
import toast from 'react-hot-toast';
import { Copy, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function API() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else {
      fetchApiKeys();
    }
  }, [session, status, router]);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/merchant/api-keys', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys.');
    }
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please provide a name for the API key.');
      return;
    }
    if (!session.user.walletAddress) {
      toast.error('Please connect your wallet to generate API keys.');
      router.push('/dashboard/merchant/wallet');
      return;
    }

    const clientId = `client_${nanoid(16)}`;
    const clientSecret = `secret_${nanoid(32)}`;
    try {
      const response = await fetch('/api/merchant/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ name: newKeyName, clientId, clientSecret, walletAddress: session.user.walletAddress }),
      });
      if (!response.ok) throw new Error('Failed to generate API key');
      const apiKey = await response.json();
      setApiKeys([...apiKeys, apiKey]);
      setIsDialogOpen(false);
      setNewKeyName('');
      toast.success('API key generated. Copy it now as it will not be shown again.', {
        duration: 5000,
        action: (
          <Button
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(`Client ID: ${clientId}\nClient Secret: ${clientSecret}`);
              toast.success('API key copied to clipboard.');
            }}
          >
            Copy
          </Button>
        ),
      });
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key.');
    }
  };

  const handleRevokeKey = async (id) => {
    try {
      await fetch(`/api/merchant/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setApiKeys(apiKeys.map((key) => (key.id === id ? { ...key, revoked: true } : key)));
      toast.success('API key revoked successfully.');
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key.');
    }
  };

  const handleCopyKey = (clientId, clientSecret) => {
    navigator.clipboard.writeText(`Client ID: ${clientId}\nClient Secret: ${clientSecret}`);
    toast.success('API key copied to clipboard.');
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">API Keys</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-merchant hover:bg-emerald-600">Generate Key</Button>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-lg">
              <DialogHeader>
                <DialogTitle>Generate New API Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Key Name (e.g., E-commerce Integration)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="border-gray-300 focus:ring-primary-merchant"
                />
                <Button onClick={handleGenerateKey} className="bg-primary-merchant hover:bg-emerald-600">
                  Generate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-700">Name</TableHead>
                    <TableHead className="text-sm text-gray-700">Client ID (Partial)</TableHead>
                    <TableHead className="text-sm text-gray-700">Status</TableHead>
                    <TableHead className="text-sm text-gray-700">Created</TableHead>
                    <TableHead className="text-sm text-gray-700">Wallet Address</TableHead>
                    <TableHead className="text-sm text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-6">
                        No API keys found. Generate a new key to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    apiKeys.map((key) => (
                      <TableRow key={key.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{key.name}</TableCell>
                        <TableCell className="text-sm text-gray-600 font-mono">
                          {key.revoked ? 'Revoked' : `${key.clientId.slice(0, 8)}...${key.clientId.slice(-4)}`}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              key.revoked
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-primary-merchant'
                            }`}
                          >
                            {key.revoked ? 'Revoked' : 'Active'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(key.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {key.walletAddress ? `${key.walletAddress.slice(0, 6)}...${key.walletAddress.slice(-4)}` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex space-x-2">
                            {!key.revoked && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyKey(key.clientId, key.clientSecret)}
                                className="flex items-center gap-1 border-gray-300 hover:bg-gray-100"
                              >
                                <Copy className="w-4 h-4" />
                                Copy
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeKey(key.id)}
                              disabled={key.revoked}
                              className="flex items-center gap-1 border-gray-300 hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Revoke
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