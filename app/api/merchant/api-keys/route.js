import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { broadcast } from '@/server/websocket';

export async function GET(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payLinks = await prisma.payLink.findMany({
      where: { merchantId: session.user.id },
    });
    return NextResponse.json(payLinks);
  } catch (error) {
    console.error('Error fetching pay links:', error);
    return NextResponse.json({ error: 'Failed to fetch pay links' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.user.walletAddress) {
    return NextResponse.json({ error: 'Wallet not connected' }, { status: 400 });
  }

  const { name, amount, currency, type, url, redirectUrl, merchantWallet } = await request.json();

  if (!name || !amount || isNaN(amount) || amount <= 0 || !url || !merchantWallet) {
    return NextResponse.json({ error: 'Name, valid amount, URL, and merchant wallet are required' }, { status: 400 });
  }

  try {
    const payLink = await prisma.payLink.create({
      data: {
        merchantId: session.user.id,
        name,
        amount: parseFloat(amount),
        currency,
        type,
        url,
        redirectUrl,
        active: true,
      },
    });

    broadcast({
      type: 'payLink',
      userId: session.user.id,
      payLink,
    });

    return NextResponse.json(payLink);
  } catch (error) {
    console.error('Error creating pay link:', error);
    return NextResponse.json({ error: 'Failed to create pay link' }, { status: 500 });
  }
}