import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const session = await auth();
  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { address, disconnect } = await request.json();

  if (disconnect) {
    try {
      await prisma.apiKey.updateMany({
        where: { userId: session.user.id, revoked: false },
        data: { revoked: true },
      });
      await prisma.user.update({
        where: { id: session.user.id },
        data: { walletAddress: null },
      });
      await prisma.wallet.delete({
        where: { userId: session.user.id },
      }).catch(() => {});
      return NextResponse.json({ message: 'Wallet disconnected and API keys revoked' });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      return NextResponse.json({ error: 'Failed to disconnect wallet' }, { status: 500 });
    }
  }

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  try {
    const wallet = await prisma.wallet.upsert({
      where: { userId: session.user.id },
      update: { address },
      create: {
        userId: session.user.id,
        address,
        network: 'Sepolia',
      },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress: address },
    });
    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error updating wallet:', error);
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
  }
}