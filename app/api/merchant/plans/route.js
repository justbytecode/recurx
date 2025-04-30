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
    const plans = await prisma.plan.findMany({
      where: { merchantId: session.user.id },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
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

  const { name, description, amount, currency, interval, type } = await request.json();
  if (!name || !amount || isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Name and valid amount are required' }, { status: 400 });
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

    broadcast({
      type: 'plan',
      action: 'created',
      userId: session.user.id,
      plan,
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await auth();
  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, name, description, amount, currency, interval, type } = await request.json();
    if (!id || !name || !amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'ID, name, and valid amount are required' }, { status: 400 });
    }

    const plan = await prisma.plan.update({
      where: { id, merchantId: session.user.id },
      data: {
        name,
        description,
        amount: parseFloat(amount),
        currency,
        interval,
        type,
      },
    });

    broadcast({
      type: 'plan',
      action: 'updated',
      userId: session.user.id,
      plan,
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await auth();
  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    await prisma.plan.delete({
      where: { id, merchantId: session.user.id },
    });

    broadcast({
      type: 'plan',
      action: 'deleted',
      userId: session.user.id,
      plan: { id },
    });

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}