'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';

export default function WalletConnectPopup({ role }) {
  const { data: session } = useSession();
  const { address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!session?.user?.walletAddress && !address) {
      setIsOpen(true);
    } else if (address && session) {
      // Update wallet address in backend
      fetch('/api/user/wallet/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ walletAddress: address }),
      }).then(() => setIsOpen(false));
    }
  }, [session, address]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-gray-900 text-white rounded-lg max-w-md">
        <div className="flex flex-col items-center gap-4 p-6">
          <h2 className="text-xl font-bold">Connect Your Wallet</h2>
          <p className="text-sm text-gray-400 text-center">
            Please connect your wallet to access the {role} dashboard.
          </p>
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <Button
                onClick={openConnectModal}
                className="bg-emerald-500 hover:bg-emerald-600 w-full"
              >
                Connect Wallet
              </Button>
            )}
          </ConnectButton.Custom>
        </div>
      </DialogContent>
    </Dialog>
  );
}