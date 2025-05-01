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
    } else if (!session.user.walletAddress) {
      // Keep popup open
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
      toast({
        title: 'Error',
        description: 'Failed to load API keys.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a name for the API key.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/merchant/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ name: newKeyName }),
      });
      if (!response.ok) throw new Error('Failed to generate API key');
      const apiKey = await response.json();
      setApiKeys([...apiKeys, apiKey]);
      setIsDialogOpen(false);
      setNewKeyName('');
      toast({
        title: 'API Key Generated',
        description: 'API key generated. Copy it now as it will not be shown again.',
        action: (
          <Button
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(`Client ID: ${apiKey.clientId}\nClient Secret: ${apiKey.clientSecret}`);
              toast({
                title: 'Copied',
                description: 'API key copied to clipboard.',
              });
            }}
          >
            Copy
          </Button>
        ),
      });
    } catch (error) {
      console.error('Error generating API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate API key.',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeKey = async (id) => {
    try {
      await fetch(`/api/merchant/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setApiKeys(apiKeys.map((key) => (key.id === id ? { ...key, revoked: true } : key)));
      toast({
        title: 'Success',
        description: 'API key revoked successfully.',
      });
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke API key.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyKey = (clientId, clientSecret) => {
    navigator.clipboard.writeText(`Client ID: ${clientId}\nClient Secret: ${clientSecret}`);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard.',
    });
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden text-white">
      {!session.user.walletAddress && <WalletConnectPopup role="merchant" />}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">API Keys</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">Generate Key</Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 text-white rounded-lg">
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Key Name (e.g., E-commerce Integration)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="border-gray-700 focus:ring-emerald-500 text-white bg-gray-800"
              />
              <Button onClick={handleGenerateKey} className="bg-emerald-500 hover:bg-emerald-600">
                Generate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>
      <Card className="shadow-lg bg-gray-900 rounded-xl border-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Your API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>{key.name}</TableCell>
                    <TableCell>{key.clientId}</TableCell>
                    <TableCell>{key.revoked ? 'Revoked' : 'Active'}</TableCell>
                    <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {!key.revoked && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyKey(key.clientId, key.clientSecret)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRevokeKey(key.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
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