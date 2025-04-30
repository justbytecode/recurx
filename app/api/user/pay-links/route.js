import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { broadcast } from '@/server/websocket';
import { nanoid } from 'nanoid';

export async function GET(request) {
  const session = await auth();
  if (!session || session.user.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payLinks = await prisma.payLink.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json(payLinks);
  } catch (error) {
    console.error('Error fetching pay links:', error);
    return NextResponse.json({ error: 'Failed to fetch pay links' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session || session.user.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.user.walletAddress) {
    return NextResponse.json({ error: 'Wallet not connected' }, { status: 400 });
  }

  const { name, amount, currency, type, redirectUrl } = await request.json();
  if (!name || !amount || isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Name and valid amount are required' }, { status: 400 });
  }

  try {
    const url = `pay/${nanoid(10)}`;
    const payLink = await prisma.payLink.create({
      data: {
        userId: session.user.id,
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