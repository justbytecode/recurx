import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { clientId, clientSecret } = request.headers;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Client ID and Client Secret are required' }, { status: 401 });
  }

  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        clientId,
        clientSecret,
        revoked: false,
      },
      include: { user: true },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 });
    }

    const plans = await prisma.plan.findMany({
      where: {
        merchantId: apiKey.userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        currency: true,
        interval: true,
        type: true,
        createdAt: true,
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}