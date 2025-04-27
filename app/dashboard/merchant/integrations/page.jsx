'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Search, Plus } from 'lucide-react';
import { subscribeToWebSocket, sendWebSocketMessage } from '@/lib/websocket';

export default function Integrations() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [integrations, setIntegrations] = useState([]);
  const [newIntegration, setNewIntegration] = useState({
    platform: '',
    webhookUrl: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else {
      fetchIntegrations();
    }
  }, [session, status, router]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/merchant/integrations', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load integrations.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.type === 'integration' && data.userId === session.user.id) {
        setIntegrations((prev) => [...prev, data.integration]);
      }
    });
    return () => ws.close();
  }, [session]);

  const handleAddIntegration = async () => {
    if (!newIntegration.platform || !newIntegration.webhookUrl) {
      toast({
        title: 'Error',
        description: 'Platform and webhook URL are required.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const response = await fetch('/api/merchant/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(newIntegration),
      });
      if (!response.ok) {
        throw new Error('Failed to add integration');
      }
      const integration = await response.json();
      setIntegrations([...integrations, integration]);
      setIsDialogOpen(false);
      setNewIntegration({ platform: '', webhookUrl: '' });
      toast({
        title: 'Integration Added',
        description: 'The integration has been added successfully.',
      });

      const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
      sendWebSocketMessage(ws, {
        type: 'integration',
        userId: session.user.id,
        integration,
      });
    } catch (error) {
      console.error('Error adding integration:', error);
      toast({
        title: 'Error',
        description: 'Failed to add integration.',
        variant: 'destructive',
      });
    }
  };

  const filteredIntegrations = integrations.filter((integration) =>
    integration.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Integrations</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-gray-300 focus:ring-primary-merchant"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary-merchant hover:bg-emerald-600 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Integration
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-lg">
                <DialogHeader>
                  <DialogTitle>Add New Integration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select
                    value={newIntegration.platform}
                    onValueChange={(value) => setNewIntegration({ ...newIntegration, platform: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-primary-merchant">
                      <SelectValue placeholder="Select Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Shopify">Shopify</SelectItem>
                      <SelectItem value="Zapier">Zapier</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Webhook URL"
                    value={newIntegration.webhookUrl}
                    onChange={(e) => setNewIntegration({ ...newIntegration, webhookUrl: e.target.value })}
                    className="border-gray-300 focus:ring-primary-merchant"
                  />
                  <Button onClick={handleAddIntegration} className="bg-primary-merchant hover:bg-emerald-600">
                    Add
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-700">Platform</TableHead>
                    <TableHead className="text-sm text-gray-700">Webhook URL</TableHead>
                    <TableHead className="text-sm text-gray-700">Status</TableHead>
                    <TableHead className="text-sm text-gray-700">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIntegrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-6">
                        No integrations found. Add a new integration to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIntegrations.map((integration) => (
                      <TableRow key={integration.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{integration.platform}</TableCell>
                        <TableCell className="text-sm text-gray-600 truncate max-w-[200px]">
                          {integration.webhookUrl}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              integration.active
                                ? 'bg-green-100 text-primary-merchant'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {integration.active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(integration.createdAt).toLocaleDateString()}
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