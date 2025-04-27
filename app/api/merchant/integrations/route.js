import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const integrations = await prisma.integration.findMany({
      where: { merchantId: session.user.id },
    });
    return NextResponse.json(integrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { platform, webhookUrl } = await request.json();

  if (!platform || !webhookUrl) {
    return NextResponse.json(
      { error: 'Platform and webhook URL are required' },
      { status: 400 }
    );
  }

  try {
    const integration = await prisma.integration.create({
      data: {
        merchantId: session.user.id,
        platform,
        webhookUrl,
        active: true,
      },
    });
    return NextResponse.json(integration);
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}