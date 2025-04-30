'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { ethers } from 'ethers';
import { Loader2 } from 'lucide-react';
import { contractABI } from '@/lib/contractABI';

export default function PayLink({ params }) {
  const router = useRouter();
  const [payLink, setPayLink] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    fetchPayLink(params.id);
  }, [params.id]);

  const fetchPayLink = async (id) => {
    try {
      const response = await fetch(`/api/pay-links/${id}`);
      if (!response.ok) throw new Error('Failed to fetch pay link');
      const data = await response.json();
      setPayLink(data);
    } catch (error) {
      console.error('Error fetching pay link:', error);
      toast({
        title: 'Error',
        description: 'Invalid or expired pay link.',
        variant: 'destructive',
      });
      router.push('/');
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: 'Error',
        description: 'Please install MetaMask to proceed.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await web3Provider.send('eth_requestAccounts', []);
      const signer = await web3Provider.getSigner();
      const address = await signer.getAddress();
      setProvider(web3Provider);
      setSigner(signer);
      setWalletAddress(address);
      toast({
        title: 'Success',
        description: 'Wallet connected successfully.',
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect wallet.',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async () => {
    if (!signer || !payLink) return;
    setIsLoading(true);

    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      let tx;
      if (payLink.type === 'subscription') {
        // Approve token for subscription
        if (payLink.currency !== 'ETH') {
          const tokenContract = new ethers.Contract(
            payLink.currency === 'USDC' ? process.env.NEXT_PUBLIC_USDC_ADDRESS : process.env.NEXT_PUBLIC_USDT_ADDRESS,
            ['function approve(address spender, uint256 amount) public returns (bool)'],
            signer
          );
          const amount = ethers.parseUnits(payLink.amount.toString(), 6); // Assuming 6 decimals for USDC/USDT
          const approveTx = await tokenContract.approve(contractAddress, amount);
          await approveTx.wait();
        }
        tx = await contract.createSubscription(
          payLink.merchantWallet,
          payLink.currency === 'ETH' ? 0 : payLink.currency === 'USDC' ? 1 : 2,
          ethers.parseUnits(payLink.amount.toString(), payLink.currency === 'ETH' ? 18 : 6),
          payLink.interval === 'week' ? 604800 : payLink.interval === 'month' ? 2592000 : 31536000
        );
      } else {
        if (payLink.currency === 'ETH') {
          tx = await contract.processPayment(
            payLink.merchantWallet,
            0,
            { value: ethers.parseUnits(payLink.amount.toString(), 18) }
          );
        } else {
          const tokenContract = new ethers.Contract(
            payLink.currency === 'USDC' ? process.env.NEXT_PUBLIC_USDC_ADDRESS : process.env.NEXT_PUBLIC_USDT_ADDRESS,
            ['function approve(address spender, uint256 amount) public returns (bool)'],
            signer
          );
          const amount = ethers.parseUnits(payLink.amount.toString(), 6);
          const approveTx = await tokenContract.approve(contractAddress, amount);
          await approveTx.wait();
          tx = await contract.processPayment(
            payLink.merchantWallet,
            payLink.currency === 'USDC' ? 1 : 2,
            { value: 0 }
          );
        }
      }

      await tx.wait();
      await fetch('/api/pay-links/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payLinkId: payLink.id, transactionHash: tx.hash, chain: payLink.chain }),
      });

      toast({
        title: 'Success',
        description: `Payment processed. Transaction: ${tx.hash}`,
      });

      if (payLink.redirectUrl) {
        window.location.href = payLink.redirectUrl;
      } else {
        router.push('/payment/success');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!payLink) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">{payLink.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300">Amount</label>
            <div className="mt-1 bg-gray-800 text-white border-gray-700 p-2 rounded-md">
              {payLink.amount} {payLink.currency}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300">Type</label>
            <div className="mt-1 bg-gray-800 text-white border-gray-700 p-2 rounded-md">
              {payLink.type === 'subscription' ? 'Subscription' : 'One-Time Payment'}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300">Chain</label>
            <div className="mt-1 bg-gray-800 text-white border-gray-700 p-2 rounded-md">
              {payLink.chain === 'sepolia' ? 'Sepolia' : 'BNB Chain Testnet'}
            </div>
          </div>
          {!walletAddress ? (
            <Button
              onClick={connectWallet}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Connect Wallet
            </Button>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-gray-300">Wallet Address</label>
                <Input
                  value={walletAddress}
                  readOnly
                  className="mt-1 bg-gray-800 text-white border-gray-700"
                />
              </div>
              <Button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}