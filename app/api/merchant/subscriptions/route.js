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
    const subscriptions = await prisma.subscription.findMany({
      where: { plan: { merchantId: session.user.id } },
      include: { plan: true, customer: true },
    });
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}