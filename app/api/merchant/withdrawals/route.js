import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { merchantId: session.user.id },
    });
    return NextResponse.json(withdrawals);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { amount, currency, method, status } = await request.json();

  if (!amount || isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { error: 'Valid amount is required' },
      { status: 400 }
    );
  }

  try {
    const withdrawal = await prisma.withdrawal.create({
      data: {
        merchantId: session.user.id,
        amount: parseFloat(amount),
        currency,
        method,
        status,
      },
    });
    return NextResponse.json(withdrawal);
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to create withdrawal' },
      { status: 500 }
    );
  }
}