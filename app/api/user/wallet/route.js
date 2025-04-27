import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { address } = await request.json();

  if (!address) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  try {
    const wallet = await prisma.wallet.upsert({
      where: { userId: session.user.id },
      update: { address },
      create: {
        userId: session.user.id,
        address,
        network: 'Ethereum', // Default; update based on chain
      },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress: address },
    });
    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error updating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to update wallet' },
      { status: 500 }
    );
  }
}