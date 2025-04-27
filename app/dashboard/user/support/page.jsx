'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Search, Plus } from 'lucide-react';
import { subscribeToWebSocket, sendWebSocketMessage } from '@/lib/websocket';

export default function Support() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'user') {
      router.push('/auth/signin');
    } else {
      fetchTickets();
    }
  }, [session, status, router]);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/user/support', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load support tickets.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!session) return;
    const ws = subscribeToWebSocket(session.user.id, (data) => {
      if (data.type === 'supportTicket' && data.userId === session.user.id) {
        setTickets((prev) => [...prev, data.ticket]);
      }
    });
    return () => ws.close();
  }, [session]);

  const handleAddTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast({
        title: 'Error',
        description: 'Subject and description are required.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const response = await fetch('/api/user/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ ...newTicket, status: 'open' }),
      });
      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }
      const ticket = await response.json();
      setTickets([...tickets, ticket]);
      setIsDialogOpen(false);
      setNewTicket({ subject: '', description: '' });
      toast({
        title: 'Ticket Created',
        description: 'Your support ticket has been submitted.',
      });

      const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
      sendWebSocketMessage(ws, {
        type: 'supportTicket',
        userId: session.user.id,
        ticket,
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to create ticket.',
        variant: 'destructive',
      });
    }
  };

  const filteredTickets = tickets.filter((ticket) =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Support</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-gray-300 focus:ring-primary-user"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary-user hover:bg-blue-600 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-lg">
                <DialogHeader>
                  <DialogTitle>Create New Support Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Subject"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    className="border-gray-300 focus:ring-primary-user"
                  />
                  <Textarea
                    placeholder="Description"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="border-gray-300 focus:ring-primary-user"
                  />
                  <Button onClick={handleAddTicket} className="bg-primary-user hover:bg-blue-600">
                    Submit
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Your Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-700">Subject</TableHead>
                    <TableHead className="text-sm text-gray-700">Status</TableHead>
                    <TableHead className="text-sm text-gray-700">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-gray-500 py-6">
                        No support tickets found. Create a new ticket to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{ticket.subject}</TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              ticket.status === 'open'
                                ? 'bg-yellow-100 text-yellow-600'
                                : ticket.status === 'resolved'
                                ? 'bg-green-100 text-primary-user'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(ticket.createdAt).toLocaleDateString()}
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