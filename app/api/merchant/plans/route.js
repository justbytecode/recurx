import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const plans = await prisma.plan.findMany({
      where: { merchantId: session.user.id },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, description, amount, currency, interval, type } = await request.json();

  if (!name || !amount || isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { error: 'Name and valid amount are required' },
      { status: 400 }
    );
  }

  try {
    const plan = await prisma.plan.create({
      data: {
        merchantId: session.user.id,
        name,
        description,
        amount: parseFloat(amount),
        currency,
        interval,
        type,
      },
    });
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
