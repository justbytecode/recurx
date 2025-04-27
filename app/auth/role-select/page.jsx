
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';

export default function RoleSelectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    } else if (session.user.role !== 'user') {
      router.push(
        session.user.role === 'merchant'
          ? '/dashboard/merchant'
          : '/dashboard/user'
      );
    }
  }, [session, status, router]);

  const handleRoleSelect = async (role) => {
    try {
      const response = await fetch('/api/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      setIsOpen(false);
      toast({
        title: 'Role Selected',
        description: `You are now a ${role}.`,
      });
      router.push(role === 'merchant' ? '/dashboard/merchant' : '/dashboard/user');
    } catch (err) {
      setError('Failed to update role. Please try again.');
      console.error('Role update error:', err);
    }
  };

  if (status === 'loading' || !session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Your Role</DialogTitle>
          </DialogHeader>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Welcome, {session.user.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <p>Please select your role to proceed:</p>
              <div className="flex space-x-4">
                <Button onClick={() => handleRoleSelect('merchant')} className="bg-primary-merchant hover:bg-emerald-600">
                  Merchant
                </Button>
                <Button onClick={() => handleRoleSelect('user')} className="bg-primary-user hover:bg-blue-600">
                  User
                </Button>
              </div>
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
