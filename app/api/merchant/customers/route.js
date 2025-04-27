import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      where: { merchantId: session.user.id },
      include: {
        user: true, // Refers to CustomerToUser relation
        merchant: true, // Refers to CustomerToMerchant relation
      },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, email, walletAddress, billingDetails, userId } = await request.json();

  if (!name || !walletAddress) {
    return NextResponse.json(
      { error: 'Name and wallet address are required' },
      { status: 400 }
    );
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        merchantId: session.user.id,
        userId, // Optional: links to a User if provided
        name,
        email,
        walletAddress,
        billingDetails,
      },
      include: {
        user: true,
        merchant: true,
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}